/**
 * Equipos visibles en BSC 2026 — solo Tier B+ activos (lista curada BSEN/Liquipedia).
 */
import allTeams from "./generated/teams.json";
import { bscMatches } from "./bsc-matches";
import { bsc2026Tournaments } from "./bsc-tournaments";
import { BSC_FANTASY_PARTICIPANTS } from "./bsc-fantasy-participants";
import {
  BSC_2026_ACTIVE_SLUG_SET,
  BSC_2026_EXCLUDED_SLUG_SET,
  isBsc2026ActiveTeam,
} from "./bsc-2026-active-teams";
import {
  getGeneratedMatches,
  normalizeParticipantList,
  normalizeParticipantSlug,
  TEAM_ROSTER_ALIASES,
} from "./catalog";
import type { GeneratedTeam } from "./catalog-types";
import { BSC_2026_TEAM_SLUGS } from "./bsc-2026-rosters";
import { TEAMS_2026_SLUGS } from "./teams-2026";

const KNOWN_TEAM_SLUGS = new Set((allTeams as GeneratedTeam[]).map((t) => t.slug));

function canonicalTeamSlug(raw: string): string | null {
  const n = normalizeParticipantSlug(raw) ?? raw.trim().toLowerCase();
  if (!n || BSC_2026_EXCLUDED_SLUG_SET.has(n)) return null;
  const canon = TEAM_ROSTER_ALIASES[n] ?? n;
  const resolved = KNOWN_TEAM_SLUGS.has(canon) ? canon : KNOWN_TEAM_SLUGS.has(n) ? n : null;
  if (!resolved || !isBsc2026ActiveTeam(resolved)) return null;
  return resolved;
}

function addPlayed(out: Set<string>, raw: string) {
  const slug = canonicalTeamSlug(raw);
  if (slug) out.add(slug);
}

function isBscCircuitTournament(slug: string): boolean {
  return /^bsc-2026|^world-finals-2026/i.test(slug);
}

function buildPlayedTeamSlugs(): Set<string> {
  const out = new Set<string>();

  for (const s of BSC_2026_ACTIVE_SLUG_SET) addPlayed(out, s);

  for (const m of bscMatches) {
    addPlayed(out, m.teamASlug);
    addPlayed(out, m.teamBSlug);
  }

  for (const m of getGeneratedMatches()) {
    if (!m.date?.startsWith("2026")) continue;
    if (!isBscCircuitTournament(m.tournamentSlug)) continue;
    addPlayed(out, m.teamASlug);
    addPlayed(out, m.teamBSlug);
  }

  for (const t of bsc2026Tournaments) {
    if (t.winnerSlug) addPlayed(out, t.winnerSlug);
    for (const raw of t.participantSlugs ?? []) addPlayed(out, raw);
  }

  for (const list of Object.values(BSC_FANTASY_PARTICIPANTS)) {
    for (const raw of list) addPlayed(out, raw);
  }

  for (const slug of BSC_2026_TEAM_SLUGS) addPlayed(out, slug);

  return out;
}

let cache: Set<string> | null = null;

export function getBsc2026PlayedTeamSlugs(): Set<string> {
  if (!cache) cache = buildPlayedTeamSlugs();
  return cache;
}

export function hasPlayedBsc2026(slug: string): boolean {
  const n = canonicalTeamSlug(slug);
  return n ? getBsc2026PlayedTeamSlugs().has(n) : false;
}

export function filterPlayedBsc2026Slugs(slugs: string[]): string[] {
  return normalizeParticipantList(slugs).filter((s) => hasPlayedBsc2026(s));
}

export function getCompetitiveTeamSlugs(): string[] {
  const out = new Set<string>([...getBsc2026PlayedTeamSlugs(), ...TEAMS_2026_SLUGS]);
  return [...out]
    .filter((s) => isBsc2026ActiveTeam(s))
    .sort((a, b) => a.localeCompare(b));
}
