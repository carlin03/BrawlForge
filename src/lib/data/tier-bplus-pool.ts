/**
 * Pool tier B+ (S/A/B) del circuito 2026 — equipos descubiertos vía partidos Liquipedia.
 */
import teamsDiscovered from "./generated/teams-discovered.json";
import { BSC_2026_ACTIVE_TEAM_SLUGS } from "./bsc-2026-active-teams";
import { USER_LOGO_TOURNAMENT_COUNT } from "./curated-tournaments";

/** Equipos únicos tier B+ en partidos 2026 (Liquipedia). */
export const TIER_BPLUS_TEAM_COUNT = teamsDiscovered.length;

/** Clubes BSC 2026 con plantilla completa (núcleo curado). */
export const BSC_CORE_CLUB_COUNT = BSC_2026_ACTIVE_TEAM_SLUGS.length;

/** Torneos públicos con logo manual (~43). */
export const TIER_BPLUS_TOURNAMENT_COUNT = USER_LOGO_TOURNAMENT_COUNT;
