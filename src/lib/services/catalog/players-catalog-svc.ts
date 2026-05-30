import { logCmsAudit } from "@/lib/cms/audit";
import {
  getAdminCatalogPlayerRows,
  mergeAdminPlayerRows,
  type AdminPlayerCatalogRow,
} from "@/lib/data/admin-bsc-players";
import {
  mergeCardThemeIntoMeta,
  mergeCardWatermarkIntoMeta,
  parseCardThemeMeta,
  parseCardWatermark,
} from "@/lib/data/card-theme-meta";
import { getPlayer } from "@/lib/data/players";
import { normalizeAdminMediaUrl } from "@/lib/image-fetch-url";
import {
  buildPlayerMeta,
  parsePlayerMeta,
  parseSocial,
  pruneSocial,
} from "@/lib/data/profile-wiki";
import type { SupabaseServerClient } from "./roster-sync";
import { syncPlayerRosterOnTeamChange } from "./roster-sync";

export type PlayersCatalogSyncStatus = {
  localTotal: number;
  inCatalog: number;
  pendingImport: number;
};

export function getLocalPlayersSyncBatch(existingSlugs: Set<string>) {
  const rows = getAdminCatalogPlayerRows();
  const toImport = rows.filter((r) => !existingSlugs.has(r.slug));
  return { rows, toImport, total: rows.length };
}

export function adminPlayerRowToDbPayload(row: AdminPlayerCatalogRow, syncedAt: string) {
  const profile = parsePlayerMeta(row.meta);
  const mains = profile.main_brawlers ?? [];
  return {
    slug: row.slug,
    ign: row.ign,
    real_name: row.real_name,
    team_slug: row.team_slug,
    region: row.region,
    role: row.role,
    status: row.status,
    fantasy_points: row.fantasy_points,
    fantasy_ownership: row.fantasy_ownership,
    rating: row.rating,
    bio: row.bio,
    photo_url: row.photo_url,
    liquipedia_page: row.liquipedia_page ?? null,
    liquipedia_url: row.liquipedia_url ?? null,
    country: row.country ?? null,
    nationality: row.nationality ?? null,
    join_date: row.join_date ?? null,
    primary_brawler: row.primary_brawler ?? (mains[0] ? String(mains[0]) : null),
    secondary_brawler: row.secondary_brawler ?? (mains[1] ? String(mains[1]) : null),
    is_captain: Boolean(row.is_captain),
    previous_teams: row.previous_teams ?? [],
    social: pruneSocial(row.social),
    meta: row.meta,
    synced_at: syncedAt,
  };
}

export function buildPlayerPayloadFromAdminRow(row: Record<string, unknown>, syncedAt: string) {
  const p = getPlayer(String(row.slug));
  const rawMeta =
    row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
      ? (row.meta as Record<string, unknown>)
      : {};
  const profile = parsePlayerMeta(row.profile ?? rawMeta);
  const rawPhoto = row.photo_url ? String(row.photo_url).trim() : "";
  const photoUrl = rawPhoto ? normalizeAdminMediaUrl(rawPhoto) ?? rawPhoto : null;
  const mains = profile.main_brawlers ?? [];
  const cardTheme = parseCardThemeMeta(rawMeta);
  let meta = mergeCardThemeIntoMeta(
    { ...rawMeta, ...buildPlayerMeta(profile, photoUrl) },
    cardTheme,
  );
  if (rawMeta.card_watermark) {
    meta = mergeCardWatermarkIntoMeta(meta, parseCardWatermark(rawMeta.card_watermark));
  }
  return {
    slug: String(row.slug),
    ign: String(row.ign ?? p?.ign ?? row.slug),
    real_name: row.real_name ? String(row.real_name) : null,
    team_slug: row.team_slug ? String(row.team_slug) : null,
    region: String(row.region ?? p?.region ?? "GLOBAL"),
    role: String(row.role ?? "Player"),
    status: String(row.status ?? "active"),
    fantasy_points: Number(row.fantasy_points ?? p?.fantasyPoints ?? 70),
    fantasy_ownership: Number(row.fantasy_ownership ?? p?.fantasyOwnership ?? 30),
    rating: Number(row.rating ?? p?.rating ?? 1),
    bio: row.bio ? String(row.bio) : null,
    photo_url: photoUrl,
    liquipedia_page: row.liquipedia_page ? String(row.liquipedia_page) : null,
    liquipedia_url: row.liquipedia_url ? String(row.liquipedia_url) : null,
    country: row.country ? String(row.country) : null,
    nationality: row.nationality ? String(row.nationality) : null,
    join_date: row.join_date ? String(row.join_date) : null,
    primary_brawler: row.primary_brawler
      ? String(row.primary_brawler)
      : mains[0]
        ? String(mains[0])
        : null,
    secondary_brawler: row.secondary_brawler
      ? String(row.secondary_brawler)
      : mains[1]
        ? String(mains[1])
        : null,
    is_captain: Boolean(row.is_captain),
    previous_teams: Array.isArray(row.previous_teams)
      ? row.previous_teams
      : String(row.previous_teams ?? "")
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean),
    social: pruneSocial(parseSocial(row.social ?? {})),
    meta,
    synced_at: syncedAt,
  };
}

export async function listMergedPlayers(supabase: SupabaseServerClient | null) {
  if (!supabase) {
    const local = getAdminCatalogPlayerRows();
    return {
      source: "local" as const,
      players: mergeAdminPlayerRows(null),
      sync: {
        localTotal: local.length,
        inCatalog: 0,
        pendingImport: local.length,
      },
    };
  }

  const { data, error } = await supabase
    .from("players_catalog")
    .select("*")
    .order("fantasy_points", { ascending: false });
  if (error && error.code !== "42P01") throw new Error(error.message);

  const catalog = data?.length ? data : null;
  const existingSlugs = new Set((data ?? []).map((r) => String(r.slug)));
  const { toImport, total } = getLocalPlayersSyncBatch(existingSlugs);

  return {
    source: "supabase" as const,
    players: mergeAdminPlayerRows(catalog),
    sync: {
      localTotal: total,
      inCatalog: existingSlugs.size,
      pendingImport: toImport.length,
    },
  };
}

export async function upsertPlayer(supabase: SupabaseServerClient, row: Record<string, unknown>) {
  const playerSlug = String(row.slug);
  const { data: prev } = await supabase
    .from("players_catalog")
    .select("team_slug")
    .eq("slug", playerSlug)
    .maybeSingle();
  const previousTeamSlug = prev?.team_slug ? String(prev.team_slug) : null;

  const syncedAt = new Date().toISOString();
  const payload = buildPlayerPayloadFromAdminRow(row, syncedAt);

  let { error } = await supabase.from("players_catalog").upsert(payload);
  if (error?.message?.includes("photo_url")) {
    const { photo_url: _p, ...withoutPhoto } = payload;
    ({ error } = await supabase.from("players_catalog").upsert({
      ...withoutPhoto,
      meta: payload.photo_url ? { ...payload.meta, photo_url: payload.photo_url } : payload.meta,
    }));
  }
  if (error) throw new Error(error.message);

  await syncPlayerRosterOnTeamChange(
    supabase,
    playerSlug,
    payload.team_slug,
    previousTeamSlug,
  );

  await logCmsAudit({
    action: "players_catalog.upsert",
    entityType: "player",
    entityId: payload.slug,
    diff: { ign: payload.ign, team_slug: payload.team_slug },
  });

  const teamNote = payload.team_slug ? ` · Club: ${payload.team_slug}` : " · Sin club";
  return { message: `Jugador ${payload.ign} guardado${teamNote}`, slug: payload.slug };
}

export async function deletePlayer(supabase: SupabaseServerClient, slug: string) {
  const { error } = await supabase.from("players_catalog").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
  await logCmsAudit({
    action: "players_catalog.delete",
    entityType: "player",
    entityId: slug,
  });
  return { message: `${slug} eliminado del catálogo` };
}

export async function syncPlayersFromLocal(supabase: SupabaseServerClient, limit?: number) {
  const { data: existing } = await supabase.from("players_catalog").select("slug").limit(2000);
  const existingSlugs = new Set((existing ?? []).map((r) => String(r.slug)));
  const { toImport, total } = getLocalPlayersSyncBatch(existingSlugs);
  const slice = limit ? toImport.slice(0, limit) : toImport;

  if (!slice.length) {
    return {
      imported: 0,
      message: "Todos los jugadores BSC ya están en Supabase.",
      webTotal: total,
      catalogCount: existingSlugs.size,
    };
  }

  const syncedAt = new Date().toISOString();
  const batch = slice.map((r) => adminPlayerRowToDbPayload(r, syncedAt));
  const { error } = await supabase.from("players_catalog").upsert(batch);
  if (error) throw new Error(error.message);

  await logCmsAudit({
    action: "players_catalog.sync_local",
    entityType: "player",
    entityId: "batch",
    diff: { count: batch.length },
  });

  return {
    imported: batch.length,
    message: `${batch.length} jugador(es) importados desde plantillas BSC locales.`,
    webTotal: total,
    catalogCount: existingSlugs.size + batch.length,
    pendingRemaining: toImport.length - batch.length,
  };
}
