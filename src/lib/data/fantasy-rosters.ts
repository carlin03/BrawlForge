import { bscMatches } from "./bsc-matches";
import { bsc2026Tournaments, BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";
import { getMatchesByTournament, getTournament, tournaments } from "./matches";
import {
  getTournamentParticipants,
  resolveTournamentSlug,
  TEAM_ROSTER_ALIASES,
  normalizeParticipantList,
} from "./catalog";
import { getPlayersByTeam } from "./players";
import { getTeam, teams } from "./teams";

export { TEAM_ROSTER_ALIASES, normalizeParticipantSlug, normalizeParticipantList } from "./catalog";

const KNOWN = new Set(teams.map((t) => t.slug));

function rosterSourceSlug(teamSlug: string): string {
  return TEAM_ROSTER_ALIASES[teamSlug] ?? teamSlug;
}

/** Jugadores fichables de un equipo (roster Liquipedia + plantilla activa) */
export function getFantasyTeamPlayerSlugs(teamSlug: string): string[] {
  const source = rosterSourceSlug(teamSlug);
  const team = getTeam(source) ?? getTeam(teamSlug);
  const fromRoster = team?.roster ?? [];
  const fromDb = getPlayersByTeam(source).map((p) => p.slug);
  const fromDbAlias = source !== teamSlug ? getPlayersByTeam(teamSlug).map((p) => p.slug) : [];

  const merged = [...new Set([...fromRoster, ...fromDb, ...fromDbAlias])].filter(Boolean);
  if (merged.length > 0) return merged;

  return getPlayersByTeam(teamSlug).map((p) => p.slug);
}

function teamsFromCuratedMatches(tournamentSlug: string): string[] {
  const alias = BSC_TOURNAMENT_ALIASES[tournamentSlug];
  const slugs = alias ? [tournamentSlug, alias] : [tournamentSlug];
  const out = new Set<string>();
  for (const m of bscMatches) {
    if (!slugs.includes(m.tournamentSlug)) continue;
    if (KNOWN.has(m.teamASlug)) out.add(m.teamASlug);
    if (KNOWN.has(m.teamBSlug)) out.add(m.teamBSlug);
  }
  return [...out];
}

function teamsFromAllMatches(tournamentSlug: string): string[] {
  const out = new Set<string>();
  for (const m of getMatchesByTournament(tournamentSlug)) {
    if (KNOWN.has(m.teamASlug)) out.add(m.teamASlug);
    if (KNOWN.has(m.teamBSlug)) out.add(m.teamBSlug);
  }
  return [...out];
}

function teamsFromParticipants(tournamentSlug: string): string[] {
  const resolved = resolveTournamentSlug(tournamentSlug);
  const t = getTournament(resolved) ?? getTournament(tournamentSlug);
  const raw = t?.participantSlugs?.length
    ? t.participantSlugs
    : getTournamentParticipants(resolved);
  return normalizeParticipantList(raw);
}

/** Equipos participantes reales por torneo — sin volcar toda la región */
export function getFantasyTeamsForTournament(tournamentSlug: string): string[] {
  const resolved = resolveTournamentSlug(tournamentSlug);
  const slugCandidates = [...new Set([tournamentSlug, resolved])];

  for (const slug of slugCandidates) {
    const fromBsc = teamsFromCuratedMatches(slug);
    if (fromBsc.length >= 2) return fromBsc;
  }

  for (const slug of slugCandidates) {
    const fromMatches = teamsFromAllMatches(slug);
    if (fromMatches.length >= 2) return fromMatches;
  }

  const fromParticipants = teamsFromParticipants(resolved);
  if (fromParticipants.length >= 2) return fromParticipants;

  for (const slug of slugCandidates) {
    const partial = teamsFromCuratedMatches(slug);
    if (partial.length > 0) return partial;
  }

  return fromParticipants;
}

export function getFantasyPlayersForTournament(tournamentSlug: string): string[] {
  const teamSlugs = getFantasyTeamsForTournament(tournamentSlug);
  const slugs = teamSlugs.flatMap((ts) => getFantasyTeamPlayerSlugs(ts));
  return [...new Set(slugs)];
}

export interface FantasyTeamGroup {
  teamSlug: string;
  players: string[];
}

export function getFantasyMarketByTeam(tournamentSlug: string): FantasyTeamGroup[] {
  const pool = new Set(getFantasyPlayersForTournament(tournamentSlug));
  return getFantasyTeamsForTournament(tournamentSlug)
    .map((teamSlug) => ({
      teamSlug,
      players: getFantasyTeamPlayerSlugs(teamSlug).filter((p) => pool.has(p)),
    }))
    .filter((g) => g.players.length > 0);
}

export interface FantasyTournamentStats {
  teamCount: number;
  playerCount: number;
  teamSlugs: string[];
}

export function getFantasyTournamentStats(tournamentSlug: string): FantasyTournamentStats {
  const teamSlugs = getFantasyTeamsForTournament(tournamentSlug);
  const players = getFantasyPlayersForTournament(tournamentSlug);
  return { teamCount: teamSlugs.length, playerCount: players.length, teamSlugs };
}

export function hasFantasyForTournament(tournamentSlug: string): boolean {
  const { teamCount, playerCount } = getFantasyTournamentStats(tournamentSlug);
  return teamCount >= 2 && playerCount >= 3;
}

/** Torneos con fantasy propio — BSC 2026 + featured con plantilla real */
export function getFantasyTournamentSlugs(): string[] {
  const slugs = new Set<string>([
    "bsc-2026-brawl-cup",
    "world-finals-2026",
    "world-finals-2025",
    ...bsc2026Tournaments.map((t) => t.slug),
  ]);

  for (const t of tournaments) {
    if (t.featured || (t.tier != null && t.tier <= 2)) {
      slugs.add(t.slug);
    }
  }

  return [...slugs].filter((slug) => hasFantasyForTournament(slug));
}

export function isFantasyTournamentActive(slug: string): boolean {
  return hasFantasyForTournament(slug);
}
