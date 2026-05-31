import type { CatalogPlayerRow, CatalogTeamRow } from "@/lib/supabase/catalog-types";
import { isHiddenTeam } from "@/lib/data/blocked-team-slugs";
import type { EsportsTeam } from "./teams";
import { BSC_2026_ACTIVE_TEAM_SLUGS } from "./bsc-2026-active-teams";

export const MIN_CIRCUIT_ROSTER = 3;

/** Equipos del circuito (Supabase/partidos) que no deben aliasarse a otro slug en logos. */
export const EXTRA_CIRCUIT_TEAM_SLUGS = new Set<string>(["ninguem-segura"]);

export const TEAM_INCOMPLETE_LABEL = "Sin integrantes suficientes";
export const PLAYER_UNASSIGNED_LABEL = "Sin equipo";

const TEAM_ORDER = new Map(BSC_2026_ACTIVE_TEAM_SLUGS.map((s, i) => [s, i]));

const catalogTeamsBySlug = new Map<string, EsportsTeam>();

/** Sincroniza equipos solo en Supabase para getTeam / isKnownTeamSlug. */
export function syncCatalogTeamsCache(rows: CatalogTeamRow[]): void {
  const { mergeCatalogTeam } = require("@/lib/catalog-merge") as typeof import("@/lib/catalog-merge");
  catalogTeamsBySlug.clear();
  for (const row of rows) {
    if (isHiddenTeam(row)) continue;
    const merged = mergeCatalogTeam(undefined, row);
    if (merged) catalogTeamsBySlug.set(merged.slug, merged);
  }
}

export function getCatalogOnlyTeam(slug: string): EsportsTeam | undefined {
  return catalogTeamsBySlug.get(slug.trim().toLowerCase());
}

export function getCatalogTeamSlugs(): string[] {
  return [...catalogTeamsBySlug.keys()];
}

export function countTeamRoster(
  slug: string,
  teamsBySlug?: Map<string, CatalogTeamRow>,
  playersBySlug?: Map<string, CatalogPlayerRow>,
): number {
  const key = slug.trim().toLowerCase();
  const row = teamsBySlug?.get(key);
  const fromRow = row?.roster_slugs?.filter(Boolean).length ?? 0;
  const fromPlayers = playersBySlug
    ? [...playersBySlug.values()].filter((p) => p.team_slug?.trim().toLowerCase() === key).length
    : 0;
  let fromLocal = 0;
  try {
    // Evita ciclo teams → circuit-roster → players → teams en init del bundle
    const { getPlayersByTeam } = require("./players") as typeof import("./players");
    fromLocal = getPlayersByTeam(key).length;
  } catch {
    fromLocal = 0;
  }
  const cached = catalogTeamsBySlug.get(key)?.roster?.length ?? 0;
  return Math.max(fromRow, fromPlayers, fromLocal, cached);
}

export function isTeamRosterComplete(
  slug: string,
  teamsBySlug?: Map<string, CatalogTeamRow>,
  playersBySlug?: Map<string, CatalogPlayerRow>,
): boolean {
  return countTeamRoster(slug, teamsBySlug, playersBySlug) >= MIN_CIRCUIT_ROSTER;
}

export type TeamRosterTier = "complete" | "incomplete";

export function getTeamRosterTier(
  slug: string,
  teamsBySlug?: Map<string, CatalogTeamRow>,
  playersBySlug?: Map<string, CatalogPlayerRow>,
): TeamRosterTier {
  return isTeamRosterComplete(slug, teamsBySlug, playersBySlug) ? "complete" : "incomplete";
}

export function sortCircuitTeams(list: EsportsTeam[]): EsportsTeam[] {
  return [...list].sort(
    (a, b) =>
      (TEAM_ORDER.get(a.slug) ?? 999) - (TEAM_ORDER.get(b.slug) ?? 999) ||
      a.name.localeCompare(b.name),
  );
}

export function partitionCircuitTeams(
  list: EsportsTeam[],
  teamsBySlug?: Map<string, CatalogTeamRow>,
  playersBySlug?: Map<string, CatalogPlayerRow>,
): { complete: EsportsTeam[]; incomplete: EsportsTeam[]; all: EsportsTeam[] } {
  const complete: EsportsTeam[] = [];
  const incomplete: EsportsTeam[] = [];
  for (const t of list) {
    if (isTeamRosterComplete(t.slug, teamsBySlug, playersBySlug)) complete.push(t);
    else incomplete.push(t);
  }
  return {
    complete: sortCircuitTeams(complete),
    incomplete: sortCircuitTeams(incomplete),
    all: [...sortCircuitTeams(complete), ...sortCircuitTeams(incomplete)],
  };
}
