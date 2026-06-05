import type { Region } from "../types";
import discoveredTeams from "./generated/teams-discovered.json";
import { getGeneratedTeams } from "./catalog";
import { isHiddenTeamSlug } from "./blocked-team-slugs";
import { getBsc2026TeamRegion } from "./bsc-2026-team-regions";
import { getTeam2026 } from "./teams-2026";
import type { EsportsTeam } from "./teams";
import { isSchedulableTeamSlug, slugToDisplayName } from "./team-display-resolve";

type DiscoveredTeamRow = {
  slug: string;
  name: string;
  tag?: string;
  region?: Region;
  source?: string;
};

const discoveredRows = (Array.isArray(discoveredTeams) ? discoveredTeams : []) as DiscoveredTeamRow[];

const generatedBySlug = new Map(getGeneratedTeams().map((t) => [t.slug, t]));
const discoveredBySlug = new Map(discoveredRows.map((t) => [t.slug.trim().toLowerCase(), t]));
const stubCache = new Map<string, EsportsTeam>();

function tagFromSlug(slug: string): string {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length >= 2) return parts.map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  return slug.slice(0, 3).toUpperCase();
}

function buildStub(slug: string, name: string, region: Region): EsportsTeam {
  return {
    slug,
    name,
    tag: tagFromSlug(slug),
    region,
    country: "",
    earnings: 0,
    rank: 99,
    rankChange: 0,
    form: [],
    roster: [],
    achievements: [],
  };
}

/** Equipo mínimo para slugs de partidos/Liquipedia que aún no están en admin. */
export function ensureAutoTeam(slug: string): EsportsTeam | undefined {
  const key = slug.trim().toLowerCase();
  if (!key || isHiddenTeamSlug(key) || !isSchedulableTeamSlug(key)) return undefined;
  if (stubCache.has(key)) return stubCache.get(key);

  const from2026 = getTeam2026(key);
  if (from2026) {
    const team = buildStub(key, from2026.name, from2026.region ?? getBsc2026TeamRegion(key) ?? "GLOBAL");
    team.tag = from2026.tag || team.tag;
    team.roster = from2026.roster ?? [];
    stubCache.set(key, team);
    return team;
  }

  const gen = generatedBySlug.get(key);
  if (gen) {
    const team = buildStub(key, gen.name, gen.region ?? getBsc2026TeamRegion(key) ?? "GLOBAL");
    team.tag = gen.tag || team.tag;
    team.country = gen.country ?? "";
    team.roster = gen.roster ?? [];
    stubCache.set(key, team);
    return team;
  }

  const disc = discoveredBySlug.get(key);
  if (disc) {
    const team = buildStub(key, disc.name, disc.region ?? getBsc2026TeamRegion(key) ?? "GLOBAL");
    if (disc.tag) team.tag = disc.tag;
    stubCache.set(key, team);
    return team;
  }

  const region = getBsc2026TeamRegion(key) ?? "GLOBAL";
  const team = buildStub(key, slugToDisplayName(key), region);
  stubCache.set(key, team);
  return team;
}

export function isAutoResolvableTeam(slug: string): boolean {
  return Boolean(ensureAutoTeam(slug));
}
