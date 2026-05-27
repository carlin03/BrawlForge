import { getTournament, tournaments } from "./matches";
import {
  getFantasyTeamsForTournament,
  getFantasyPlayersForTournament,
  getFantasyTournamentSlugs,
  isFantasyTournamentActive,
} from "./fantasy-rosters";

export interface FantasyTournamentConfig {
  slug: string;
  teamSlugs: string[];
  fantasyActive: boolean;
  teamCount: number;
  playerCount: number;
}

function buildConfig(slug: string): FantasyTournamentConfig {
  const teamSlugs = getFantasyTeamsForTournament(slug);
  const playerCount = getFantasyPlayersForTournament(slug).length;
  const active = isFantasyTournamentActive(slug);
  return {
    slug,
    teamSlugs,
    fantasyActive: active,
    teamCount: teamSlugs.length,
    playerCount,
  };
}

/** Torneos fantasy — BSC 2026 curado, equipos alineados con partidos/participantes */
export const FANTASY_TOURNAMENTS: FantasyTournamentConfig[] = getFantasyTournamentSlugs()
  .map(buildConfig)
  .filter((c) => c.teamSlugs.length > 0);

export function getFantasyTournaments(activeOnly = false) {
  const list = FANTASY_TOURNAMENTS.map((cfg) => ({
    ...cfg,
    tournament: tournaments.find((t) => t.slug === cfg.slug)!,
  })).filter((x) => x.tournament);

  if (!activeOnly) return list;

  return list.filter(
    (x) =>
      x.fantasyActive &&
      (x.tournament.status === "live" ||
        x.tournament.status === "upcoming" ||
        x.slug === "bsc-2026-brawl-cup"),
  );
}

export function getFantasyTournamentBySlug(slug: string) {
  return FANTASY_TOURNAMENTS.find((c) => c.slug === slug);
}

export { hasFantasyForTournament, getFantasyTournamentStats } from "./fantasy-rosters";

export function getFantasyTournamentTeams(slug: string): string[] {
  return getFantasyTeamsForTournament(slug);
}

export { getFantasyPlayersForTournament };
