import { bscMatches } from "./bsc-matches";
import { bsc2026Tournaments, BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";
import { BSC_FANTASY_PARTICIPANTS } from "./bsc-fantasy-participants";
import { getBscTournamentParticipantSlugs } from "./bsc-tournament-participants";
import { getMatchesByTournament, getTournament } from "./matches";
import {
  resolveTournamentSlug,
  TEAM_ROSTER_ALIASES,
  normalizeParticipantList,
} from "./catalog";
import { hasPlayedBsc2026 } from "./bsc-teams-played-2026";
import { getPlayer, getPlayersByTeam } from "./players";
import { getTeam, teams } from "./teams";
import { CURATED_TEAMS } from "./teams-curated";
import type { Region } from "../types";

export { TEAM_ROSTER_ALIASES, normalizeParticipantSlug, normalizeParticipantList } from "./catalog";

function rosterSourceSlug(teamSlug: string): string {
  return TEAM_ROSTER_ALIASES[teamSlug] ?? teamSlug;
}

function isFantasyTeamSlug(slug: string): boolean {
  const n = normalizeParticipantList([slug])[0];
  if (!n) return false;
  return hasPlayedBsc2026(n) || Boolean(getTeam(n)) || Boolean(CURATED_TEAMS[n]);
}

function add2026Team(out: Set<string>, slug: string) {
  const n = normalizeParticipantList([slug])[0];
  if (n && isFantasyTeamSlug(n)) out.add(n);
}

/** Jugadores del club para fantasy (plantilla curada + JSON). */
export function getFantasyTeamPlayerSlugs(teamSlug: string, _tournamentSlug?: string): string[] {
  const canonical = rosterSourceSlug(teamSlug);
  if (!isFantasyTeamSlug(canonical) && !isFantasyTeamSlug(teamSlug)) return [];

  const slugs = new Set<string>();
  const curatedRoster =
    CURATED_TEAMS[canonical]?.roster ?? CURATED_TEAMS[teamSlug]?.roster;
  if (curatedRoster?.length) {
    for (const r of curatedRoster) {
      if (r) slugs.add(r);
    }
  }

  const team = getTeam(canonical) ?? getTeam(teamSlug);
  for (const r of team?.roster ?? []) {
    if (r) slugs.add(r);
  }

  for (const p of getPlayersByTeam(canonical)) {
    if (p.status !== "retired") slugs.add(p.slug);
  }
  if (canonical !== teamSlug) {
    for (const p of getPlayersByTeam(teamSlug)) {
      if (p.status !== "retired") slugs.add(p.slug);
    }
  }

  return [...slugs].filter((slug) => {
    const p = getPlayer(slug);
    return p && p.status !== "retired";
  });
}

function teamsFromCuratedParticipants(tournamentSlug: string): string[] {
  const resolved = resolveTournamentSlug(tournamentSlug);
  const raw =
    BSC_FANTASY_PARTICIPANTS[tournamentSlug] ??
    BSC_FANTASY_PARTICIPANTS[resolved] ??
    [];
  return normalizeParticipantList(raw).filter((s) => isFantasyTeamSlug(s));
}

function teamsFromCuratedMatches(tournamentSlug: string): string[] {
  const alias = BSC_TOURNAMENT_ALIASES[tournamentSlug];
  const slugs = alias ? [tournamentSlug, alias] : [tournamentSlug];
  const out = new Set<string>();
  for (const m of bscMatches) {
    if (!slugs.includes(m.tournamentSlug)) continue;
    add2026Team(out, m.teamASlug);
    add2026Team(out, m.teamBSlug);
  }
  return [...out];
}

function teamsFromAllMatches(tournamentSlug: string): string[] {
  const out = new Set<string>();
  for (const m of getMatchesByTournament(tournamentSlug)) {
    add2026Team(out, m.teamASlug);
    add2026Team(out, m.teamBSlug);
  }
  return [...out];
}

function teamsFromParticipants(tournamentSlug: string): string[] {
  const resolved = resolveTournamentSlug(tournamentSlug);
  const t = getTournament(resolved) ?? getTournament(tournamentSlug);
  const raw = t?.participantSlugs?.length
    ? t.participantSlugs
    : getBscTournamentParticipantSlugs(resolved);
  return normalizeParticipantList(raw).filter((s) => isFantasyTeamSlug(s));
}

function teamsFromRegionPool(tournamentSlug: string): string[] {
  const resolved = resolveTournamentSlug(tournamentSlug);
  const t = getTournament(resolved) ?? getTournament(tournamentSlug);
  if (!t) return [];

  const region = t.region as Region;
  const limit = Math.max(t.teams || 8, 4);

  const ranked = teams
    .filter((team) => hasPlayedBsc2026(team.slug))
    .filter((team) => region === "GLOBAL" || team.region === region)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  return ranked.map((team) => team.slug).slice(0, limit);
}

function sortTeamSlugs(slugs: string[]): string[] {
  return [...slugs].sort((a, b) => {
    const ra = getTeam(a)?.rank ?? 999;
    const rb = getTeam(b)?.rank ?? 999;
    return ra - rb;
  });
}

/** Une todas las fuentes: curado BSC → participantes JSON → partidos → pool regional */
export function getFantasyTeamsForTournament(tournamentSlug: string): string[] {
  const resolved = resolveTournamentSlug(tournamentSlug);
  const slugCandidates = [...new Set([tournamentSlug, resolved])];
  const out = new Set<string>();

  for (const slug of slugCandidates) {
    for (const t of teamsFromCuratedParticipants(slug)) out.add(t);
    for (const t of teamsFromParticipants(resolved)) out.add(t);
    for (const t of teamsFromCuratedMatches(slug)) out.add(t);
    for (const t of teamsFromAllMatches(slug)) out.add(t);
  }

  const t = getTournament(resolved) ?? getTournament(tournamentSlug);
  const target = Math.max(t?.teams ?? 8, 4);
  if (out.size < target) {
    for (const ts of teamsFromRegionPool(resolved)) {
      out.add(ts);
      if (out.size >= target) break;
    }
  }

  return sortTeamSlugs([...out]);
}

export function getFantasyPlayersForTournament(tournamentSlug: string): string[] {
  const teamSlugs = getFantasyTeamsForTournament(tournamentSlug);
  const slugs = teamSlugs.flatMap((ts) => getFantasyTeamPlayerSlugs(ts, tournamentSlug));
  return [...new Set(slugs)];
}

export function getFantasyMarketByTeam(tournamentSlug: string): FantasyTeamGroup[] {
  return getFantasyTeamsForTournament(tournamentSlug)
    .map((teamSlug) => ({
      teamSlug,
      players: getFantasyTeamPlayerSlugs(teamSlug, tournamentSlug),
    }))
    .filter((g) => g.players.length > 0)
    .sort((a, b) => {
      const ta = getTeam(a.teamSlug)?.tag ?? a.teamSlug;
      const tb = getTeam(b.teamSlug)?.tag ?? b.teamSlug;
      return ta.localeCompare(tb);
    });
}

export interface FantasyTeamGroup {
  teamSlug: string;
  players: string[];
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

const REGION_ORDER: Region[] = ["GLOBAL", "EMEA", "EA", "NA", "SA"];

export function getFantasyTournamentSlugs(): string[] {
  const slugs = new Set<string>([
    "bsc-2026-brawl-cup",
    "world-finals-2026",
    "bsc-2026-s3-emea-mf",
    "bsc-2026-s3-ea-mf",
    "bsc-2026-s3-na-mf",
    ...bsc2026Tournaments.map((t) => t.slug),
  ]);

  return [...slugs]
    .filter((slug) => hasFantasyForTournament(slug))
    .sort((a, b) => {
      const ta = getTournament(a);
      const tb = getTournament(b);
      const ra = REGION_ORDER.indexOf(ta?.region ?? "GLOBAL");
      const rb = REGION_ORDER.indexOf(tb?.region ?? "GLOBAL");
      if (ra !== rb) return ra - rb;
      return (tb?.startDate ?? "").localeCompare(ta?.startDate ?? "");
    });
}

export function isFantasyTournamentActive(slug: string): boolean {
  return hasFantasyForTournament(slug);
}
