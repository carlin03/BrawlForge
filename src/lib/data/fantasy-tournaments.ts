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

let fantasyTournamentsCache: FantasyTournamentConfig[] | null = null;

function loadFantasyTournaments(): FantasyTournamentConfig[] {
  return getFantasyTournamentSlugs()
    .map(buildConfig)
    .filter((c) => c.teamSlugs.length > 0);
}

/** Torneos fantasy — BSC 2026 curado, equipos alineados con partidos/participantes */
export function getFantasyTournamentConfigs(): FantasyTournamentConfig[] {
  if (!fantasyTournamentsCache) fantasyTournamentsCache = loadFantasyTournaments();
  return fantasyTournamentsCache;
}

/** @deprecated Usa getFantasyTournamentConfigs(). */
export const FANTASY_TOURNAMENTS: FantasyTournamentConfig[] = new Proxy(
  [] as FantasyTournamentConfig[],
  {
    get(_t, prop) {
      const list = getFantasyTournamentConfigs();
      const val = Reflect.get(list, prop, list);
      return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(list) : val;
    },
  },
);

export function getFantasyTournaments(activeOnly = false) {
  const list = getFantasyTournamentConfigs().map((cfg) => ({
    ...cfg,
    tournament: tournaments.find((t) => t.slug === cfg.slug)!,
  }))
    .filter((x) => x.tournament)
    .sort((a, b) => {
      const statusOrder = { live: 0, upcoming: 1, finished: 2 };
      const sa = statusOrder[a.tournament.status] - statusOrder[b.tournament.status];
      if (sa !== 0) return sa;
      return b.tournament.startDate.localeCompare(a.tournament.startDate);
    });

  if (!activeOnly) return list;

  return list.filter(
    (x) => x.tournament.status === "live" || x.tournament.status === "upcoming",
  );
}

export function getFantasyTournamentBySlug(slug: string) {
  return getFantasyTournamentConfigs().find((c) => c.slug === slug);
}

export { hasFantasyForTournament, getFantasyTournamentStats } from "./fantasy-rosters";

export function getFantasyTournamentTeams(slug: string): string[] {
  return getFantasyTeamsForTournament(slug);
}

export { getFantasyPlayersForTournament };
