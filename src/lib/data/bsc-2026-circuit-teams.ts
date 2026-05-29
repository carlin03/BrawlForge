/**
 * Circuito BSC 2026 — equipos Tier B+ activos.
 */
import {
  BSC_2026_ACTIVE_SLUG_SET,
  BSC_2026_ACTIVE_TEAM_SLUGS,
  BSC_2026_EXCLUDED_SLUG_SET,
  isBsc2026ActiveTeam,
} from "./bsc-2026-active-teams";

/** Número oficial de clubes del circuito mostrado en home y stats. */
export const BSC_2026_CLUB_COUNT = 48;

export { BSC_2026_ACTIVE_TEAM_SLUGS as BSC_2026_CIRCUIT_CURATED };

export function getBsc2026CircuitTeamSlugs(): string[] {
  return [...BSC_2026_ACTIVE_TEAM_SLUGS].sort((a, b) => a.localeCompare(b));
}

export const BSC_2026_CIRCUIT_SLUGS = BSC_2026_ACTIVE_SLUG_SET;

export { isBsc2026ActiveTeam, BSC_2026_EXCLUDED_SLUG_SET };
