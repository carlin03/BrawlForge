import teams2026Data from "./generated/teams-2026.json";
import teamsData from "./generated/teams.json";
import catalogData from "./generated/catalog.json";
import type { GeneratedTeam } from "./catalog-types";
import { normalizeParticipantSlug, TEAM_ROSTER_ALIASES } from "./catalog";

const TEAMS_2026 = teams2026Data as GeneratedTeam[];
const ALL_TEAMS = teamsData as GeneratedTeam[];
const CATALOG_TEAMS = ((catalogData as { teams?: GeneratedTeam[] }).teams ?? []) as GeneratedTeam[];

/**
 * Equipos BSC 2026 confirmados en Liquipedia MF/MQ que el snapshot 2026 inicial
 * no incluía, pero sí existen en el catálogo general con logo.
 */
const EXTRA_BSC_2026_TEAM_SLUGS = [
  "enosis-esports",
  "kds-esports",
  "only-realm-na",
];

function buildTeams2026(): GeneratedTeam[] {
  const seen = new Set(TEAMS_2026.map((t) => t.slug));
  const out = TEAMS_2026.map((team) => {
    const catalogTeam = CATALOG_TEAMS.find((t) => t.slug === team.slug);
    if (!catalogTeam?.roster?.length || team.roster?.length) return team;
    return { ...team, roster: catalogTeam.roster };
  });
  for (const slug of EXTRA_BSC_2026_TEAM_SLUGS) {
    if (seen.has(slug)) continue;
    const team = ALL_TEAMS.find((t) => t.slug === slug) ?? CATALOG_TEAMS.find((t) => t.slug === slug);
    if (team) {
      out.push(team);
      seen.add(slug);
    }
  }
  return out;
}

const TEAMS_2026_WITH_EXTRAS = buildTeams2026();

export const TEAMS_2026_SLUGS = new Set(TEAMS_2026_WITH_EXTRAS.map((t) => t.slug));

export function getTeams2026(): GeneratedTeam[] {
  return TEAMS_2026_WITH_EXTRAS;
}

export function isTeam2026(slug: string): boolean {
  const n = normalizeParticipantSlug(slug) ?? slug;
  if (TEAMS_2026_SLUGS.has(n)) return true;
  const canonical = TEAM_ROSTER_ALIASES[n];
  return canonical ? TEAMS_2026_SLUGS.has(canonical) : false;
}

export function getTeam2026(slug: string): GeneratedTeam | undefined {
  const n = normalizeParticipantSlug(slug) ?? slug;
  return TEAMS_2026_WITH_EXTRAS.find((t) => t.slug === n || t.slug === slug);
}
