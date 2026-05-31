import type { Region } from "../types";
import { teams, getTeam } from "./teams";
import { BSC_2026_REGISTRY_SLUGS, getBsc2026TeamEntry } from "./bsc-2026-team-registry";
import { BSC_2026_ACTIVE_TEAM_SLUGS } from "./bsc-2026-active-teams";
import { BSC_2026_ROSTERS } from "./bsc-2026-rosters";
import { getBsc2026TeamRegion } from "./bsc-2026-team-regions";
import {
  type AdminTeamCatalogRow,
  pickTeamFromDb,
} from "./admin-catalog-fields";
import { isHiddenTeam, isHiddenTeamSlug } from "./blocked-team-slugs";
import { parseAchievements, parseSocial } from "./profile-wiki";

export type { AdminTeamCatalogRow };
export type AdminBscTeamItem = {
  slug: string;
  name: string;
  tag: string;
  region: Region;
};

export const BSC_2026_NEW_TEAM_SLUGS: readonly string[] = [...BSC_2026_REGISTRY_SLUGS].sort();
/** Clubes del circuito curado en código (50); el total en admin incluye extras de Supabase. */
export const BSC_2026_CORE_TEAM_COUNT = BSC_2026_ACTIVE_TEAM_SLUGS.length;
export const BSC_2026_ADMIN_TEAM_COUNT = BSC_2026_CORE_TEAM_COUNT;

export function isBsc2026NewTeam(slug: string): boolean {
  return BSC_2026_REGISTRY_SLUGS.has(slug.trim().toLowerCase());
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/\bF\/a\b/gi, "F/A");
}

/** Fila de equipo para admin — siempre para los 50 slugs BSC activos */
export function adminBscTeamToCatalogRow(slug: string): AdminTeamCatalogRow {
  const key = slug.trim().toLowerCase();
  const full = getTeam(key) ?? teams.find((x) => x.slug === key);
  const reg = getBsc2026TeamEntry(key);
  const region = (getBsc2026TeamRegion(key) ?? reg?.region ?? full?.region ?? "GLOBAL") as Region;

  return {
    slug: key,
    name: full?.name ?? reg?.name ?? humanizeSlug(key),
    tag: full?.tag ?? reg?.tag ?? key.slice(0, 3).toUpperCase(),
    region,
    country: full?.country ?? reg?.country ?? "",
    earnings: full?.earnings ?? 0,
    rank: full?.rank ?? null,
    rank_change: full?.rankChange ?? 0,
    form: (full?.form ?? []) as string[],
    roster_slugs: full?.roster?.length ? full.roster : (BSC_2026_ROSTERS[key] ?? reg?.roster ?? []),
    logo_url: null,
    description: null,
    circuit_status: "active",
    bsc_qualified_2026: true,
    circuit_summary: null,
    headquarters: reg?.country ?? full?.country ?? "",
    achievements: full?.achievements ?? [],
    social: {},
    meta: {},
  };
}

export function adminCatalogRowsToTeamItems(rows: AdminTeamCatalogRow[]): AdminBscTeamItem[] {
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    tag: row.tag,
    region: row.region as Region,
  }));
}

/** Lista mínima para logos — usa filas ya fusionadas (API admin / Supabase). */
export function getAdminBscTeamsListFromRows(rows?: AdminTeamCatalogRow[]): AdminBscTeamItem[] {
  if (rows?.length) return adminCatalogRowsToTeamItems(rows);
  return getAdminBscTeamsList();
}

/** Clubes BSC curados en código — orden oficial */
export function getAdminBscTeamsList(): AdminBscTeamItem[] {
  const order = new Map(BSC_2026_ACTIVE_TEAM_SLUGS.map((s, i) => [s, i]));

  return BSC_2026_ACTIVE_TEAM_SLUGS.map((slug) => {
    const row = adminBscTeamToCatalogRow(slug);
    return {
      slug: row.slug,
      name: row.name,
      tag: row.tag,
      region: row.region as Region,
    };
  }).sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}

/** Catálogo completo equipos BSC para API admin */
export function getAdminCatalogTeamRows(): AdminTeamCatalogRow[] {
  return getAdminBscTeamsList().map((t) => adminBscTeamToCatalogRow(t.slug));
}

export function mergeAdminTeamRows(
  catalogRows: Array<Record<string, unknown>> | null | undefined,
): AdminTeamCatalogRow[] {
  const bySlug = new Map<string, AdminTeamCatalogRow>();
  for (const row of getAdminCatalogTeamRows()) {
    bySlug.set(row.slug, { ...row });
  }
  for (const row of catalogRows ?? []) {
    const slug = String(row.slug ?? "").trim().toLowerCase();
    if (!slug || isHiddenTeam({ slug, name: String(row.name ?? "") })) continue;
    const base = bySlug.get(slug) ?? adminBscTeamToCatalogRow(slug);
    const roster = row.roster_slugs;
    bySlug.set(slug, {
      ...base,
      name: String(row.name ?? base.name),
      tag: String(row.tag ?? base.tag),
      region: String(row.region ?? base.region),
      country: String(row.country ?? base.country),
      earnings: Number(row.earnings ?? base.earnings),
      rank: row.rank != null ? Number(row.rank) : base.rank,
      rank_change: Number(row.rank_change ?? base.rank_change),
      form: Array.isArray(row.form) ? (row.form as string[]) : base.form,
      roster_slugs: Array.isArray(roster)
        ? (roster as string[])
        : typeof roster === "string" && roster.trim()
          ? roster
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : base.roster_slugs,
      logo_url: row.logo_url ? String(row.logo_url) : base.logo_url,
      description: row.description ? String(row.description) : base.description,
      achievements: parseAchievements(row.achievements ?? base.achievements),
      social: parseSocial(row.social ?? base.social),
      meta:
        row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
          ? (row.meta as Record<string, unknown>)
          : base.meta,
      ...pickTeamFromDb(row),
    });
  }
  const orderIdx = new Map(BSC_2026_ACTIVE_TEAM_SLUGS.map((s, i) => [s, i]));
  return [...bySlug.values()]
    .filter((t) => !isHiddenTeam(t))
    .sort((a, b) => (orderIdx.get(a.slug) ?? 999) - (orderIdx.get(b.slug) ?? 999));
}
