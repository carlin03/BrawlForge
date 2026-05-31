import { logCmsAudit } from "@/lib/cms/audit";
import {
  BSC_2026_CORE_TEAM_COUNT,
  getAdminCatalogTeamRows,
  mergeAdminTeamRows,
  type AdminTeamCatalogRow,
} from "@/lib/data/admin-bsc-teams";
import {
  mergeCardThemeIntoMeta,
  parseCardThemeMeta,
} from "@/lib/data/card-theme-meta";
import { isHiddenTeam, isHiddenTeamSlug } from "@/lib/data/blocked-team-slugs";
import { purgePhantomTeamsFromDb } from "@/lib/admin/purge-phantom-teams";
import { getTeam } from "@/lib/data/teams";
import {
  buildTeamMeta,
  parseAchievements,
  parseSocial,
  parseTeamMeta,
  pruneSocial,
} from "@/lib/data/profile-wiki";
import { parseTeamSponsors } from "@/lib/data/team-page-stats";
import type { SupabaseServerClient } from "./roster-sync";

export type TeamsCatalogSyncStatus = {
  localTotal: number;
  inCatalog: number;
  pendingImport: number;
};

export function getLocalTeamsSyncBatch(existingSlugs: Set<string>) {
  const rows = getAdminCatalogTeamRows();
  const toImport = rows.filter((r) => !existingSlugs.has(r.slug));
  return { rows, toImport, total: rows.length };
}

export function adminTeamRowToDbPayload(row: AdminTeamCatalogRow, syncedAt: string) {
  const profile = parseTeamMeta(row.meta);
  const sponsors =
    row.sponsors_json?.length
      ? row.sponsors_json
      : profile.sponsors
        ? Array.isArray(profile.sponsors)
          ? profile.sponsors
          : []
        : [];
  return {
    slug: row.slug,
    name: row.name,
    tag: row.tag,
    region: row.region,
    country: row.country,
    earnings: row.earnings,
    rank: row.rank,
    rank_change: row.rank_change,
    form: row.form,
    roster_slugs: row.roster_slugs,
    logo_url: row.logo_url,
    description: row.description,
    coach: row.coach ?? null,
    manager: row.manager ?? profile.manager ?? null,
    captain_slug: row.captain_slug ?? null,
    peak_rank: row.peak_rank ?? profile.peak_rank ?? null,
    founded_year: row.founded_year ?? null,
    headquarters: row.headquarters ?? null,
    website: row.website ?? null,
    liquipedia_url: row.liquipedia_url ?? null,
    circuit_status: row.circuit_status ?? "active",
    bsc_qualified_2026: row.bsc_qualified_2026 !== false,
    circuit_summary: row.circuit_summary ?? null,
    achievements: row.achievements,
    sponsors_json: sponsors,
    social: pruneSocial(row.social),
    meta: row.meta,
    synced_at: syncedAt,
  };
}

export function buildTeamPayloadFromAdminRow(row: Record<string, unknown>, syncedAt: string) {
  const rawMeta =
    row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
      ? (row.meta as Record<string, unknown>)
      : {};
  const profile = parseTeamMeta(row.profile ?? rawMeta);
  const achievements = parseAchievements(row.achievements ?? []);
  const social = pruneSocial(parseSocial(row.social ?? {}));
  const coach = row.coach ? String(row.coach) : null;
  const cardTheme = parseCardThemeMeta(rawMeta) ?? parseCardThemeMeta({ card_theme: row.card_theme });
  const meta = mergeCardThemeIntoMeta(
    { ...rawMeta, ...buildTeamMeta(profile, { coach }) },
    cardTheme,
  );
  return {
    slug: String(row.slug),
    name: String(row.name ?? getTeam(String(row.slug))?.name ?? row.slug),
    tag: String(row.tag ?? ""),
    region: String(row.region ?? "GLOBAL"),
    country: String(row.country ?? ""),
    earnings: Number(row.earnings ?? 0),
    rank: row.rank != null ? Number(row.rank) : null,
    rank_change: Number(row.rank_change ?? 0),
    form: Array.isArray(row.form)
      ? row.form
      : String(row.form ?? "")
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean),
    manager:
      row.manager != null && String(row.manager).trim()
        ? String(row.manager).trim()
        : profile.manager ?? null,
    captain_slug:
      row.captain_slug != null && String(row.captain_slug).trim()
        ? String(row.captain_slug).trim()
        : typeof rawMeta.captain_slug === "string"
          ? rawMeta.captain_slug
          : null,
    peak_rank:
      row.peak_rank != null && row.peak_rank !== ""
        ? Number(row.peak_rank)
        : profile.peak_rank ?? null,
    liquipedia_url: row.liquipedia_url ? String(row.liquipedia_url) : null,
    roster_slugs: Array.isArray(row.roster_slugs)
      ? row.roster_slugs
      : String(row.roster_slugs ?? "")
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean),
    logo_url: row.logo_url ? String(row.logo_url) : null,
    description: row.description ? String(row.description) : null,
    coach,
    founded_year: row.founded_year != null && row.founded_year !== "" ? Number(row.founded_year) : null,
    headquarters: row.headquarters ? String(row.headquarters) : null,
    website: row.website ? String(row.website) : null,
    circuit_status: String(row.circuit_status ?? "active"),
    bsc_qualified_2026: row.bsc_qualified_2026 !== false,
    circuit_summary: row.circuit_summary ? String(row.circuit_summary) : null,
    achievements,
    sponsors_json: parseTeamSponsors(row.sponsors_json ?? profile.sponsors ?? []),
    social,
    meta,
    synced_at: syncedAt,
  };
}

export async function listMergedTeams(supabase: SupabaseServerClient | null) {
  if (!supabase) {
    const teams = mergeAdminTeamRows(null);
    return {
      source: "local" as const,
      teams,
      teamCount: teams.length,
      sync: {
        localTotal: BSC_2026_CORE_TEAM_COUNT,
        inCatalog: 0,
        pendingImport: BSC_2026_CORE_TEAM_COUNT,
      },
    };
  }

  await purgePhantomTeamsFromDb(supabase);

  const { data, error } = await supabase
    .from("teams_catalog")
    .select("*")
    .order("rank", { ascending: true });
  if (error && error.code !== "42P01") throw new Error(error.message);

  const catalog = data?.length ? data : null;
  const existingSlugs = new Set((data ?? []).map((r) => String(r.slug)));
  const { toImport, total } = getLocalTeamsSyncBatch(existingSlugs);

  const teams = mergeAdminTeamRows(catalog);
  return {
    source: "supabase" as const,
    teams,
    teamCount: teams.length,
    sync: {
      localTotal: total,
      inCatalog: existingSlugs.size,
      pendingImport: toImport.length,
    },
  };
}

export async function getTeamsSyncStatus(supabase: SupabaseServerClient): Promise<TeamsCatalogSyncStatus> {
  const { data } = await supabase.from("teams_catalog").select("slug").limit(500);
  const existingSlugs = new Set((data ?? []).map((r) => String(r.slug)));
  const { toImport, total } = getLocalTeamsSyncBatch(existingSlugs);
  return {
    localTotal: total,
    inCatalog: existingSlugs.size,
    pendingImport: toImport.length,
  };
}

export async function upsertTeam(supabase: SupabaseServerClient, row: Record<string, unknown>) {
  const slug = String(row.slug ?? "").trim().toLowerCase();
  if (isHiddenTeamSlug(slug)) {
    throw new Error("Este equipo está oculto permanentemente (slug inválido).");
  }
  const syncedAt = new Date().toISOString();
  const payload = buildTeamPayloadFromAdminRow(row, syncedAt);
  const { error } = await supabase.from("teams_catalog").upsert(payload);
  if (error) throw new Error(error.message);
  await logCmsAudit({
    action: "teams_catalog.upsert",
    entityType: "team",
    entityId: payload.slug,
    diff: { name: payload.name },
  });
  return { message: `Equipo ${payload.name} guardado`, slug: payload.slug };
}

export async function deleteTeam(supabase: SupabaseServerClient, slug: string) {
  if (isHiddenTeamSlug(slug)) {
    const purged = await purgePhantomTeamsFromDb(supabase);
    return {
      message: `Equipo fantasma eliminado de la base de datos (${purged.removedTeams.join(", ") || slug}).`,
    };
  }
  const { error } = await supabase.from("teams_catalog").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
  await logCmsAudit({
    action: "teams_catalog.delete",
    entityType: "team",
    entityId: slug,
  });
  return { message: `${slug} eliminado del catálogo` };
}

export async function syncTeamsFromLocal(supabase: SupabaseServerClient, limit?: number) {
  const { data: existing } = await supabase.from("teams_catalog").select("slug").limit(500);
  const existingSlugs = new Set((existing ?? []).map((r) => String(r.slug)));
  const { toImport, total } = getLocalTeamsSyncBatch(existingSlugs);
  const slice = limit ? toImport.slice(0, limit) : toImport;

  if (!slice.length) {
    return {
      imported: 0,
      message: "Todos los equipos BSC ya están en Supabase.",
      webTotal: total,
      catalogCount: existingSlugs.size,
    };
  }

  const syncedAt = new Date().toISOString();
  const batch = slice.map((r) => adminTeamRowToDbPayload(r, syncedAt));
  const { error } = await supabase.from("teams_catalog").upsert(batch);
  if (error) throw new Error(error.message);

  await logCmsAudit({
    action: "teams_catalog.sync_local",
    entityType: "team",
    entityId: "batch",
    diff: { count: batch.length },
  });

  return {
    imported: batch.length,
    message: `${batch.length} equipo(s) importados desde el circuito BSC local.`,
    webTotal: total,
    catalogCount: existingSlugs.size + batch.length,
    pendingRemaining: toImport.length - batch.length,
  };
}
