import teams2026Data from "./generated/teams-2026.json";
import type { GeneratedTeam } from "./catalog-types";
import { normalizeParticipantSlug, TEAM_ROSTER_ALIASES } from "./catalog";

const TEAMS_2026 = teams2026Data as GeneratedTeam[];

export const TEAMS_2026_SLUGS = new Set(TEAMS_2026.map((t) => t.slug));

export function getTeams2026(): GeneratedTeam[] {
  return TEAMS_2026;
}

export function isTeam2026(slug: string): boolean {
  const n = normalizeParticipantSlug(slug) ?? slug;
  if (TEAMS_2026_SLUGS.has(n)) return true;
  const canonical = TEAM_ROSTER_ALIASES[n];
  return canonical ? TEAMS_2026_SLUGS.has(canonical) : false;
}

export function getTeam2026(slug: string): GeneratedTeam | undefined {
  const n = normalizeParticipantSlug(slug) ?? slug;
  return TEAMS_2026.find((t) => t.slug === n || t.slug === slug);
}
