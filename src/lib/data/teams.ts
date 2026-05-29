import type { Region } from "../types";
import { toLiquipediaUrl } from "./catalog";
import { getTeams2026 } from "./teams-2026";
import { BSC_2026_ACTIVE_TEAM_SLUGS, isBsc2026ActiveTeam } from "./bsc-2026-active-teams";
import { BSC_2026_ROSTERS } from "./bsc-2026-rosters";
import { BSC_2026_TEAM_REGISTRY, getBsc2026TeamEntry } from "./bsc-2026-team-registry";
import { getBsc2026TeamRegion } from "./bsc-2026-team-regions";
import { CURATED_TEAMS } from "./teams-curated";

export interface EsportsTeam {
  slug: string;
  name: string;
  tag: string;
  region: Region;
  country: string;
  earnings: number;
  rank: number;
  rankChange: number;
  form: ("W" | "L")[];
  liquipediaUrl: string;
  roster: string[];
  achievements: { place: string; tournament: string; prize: string; date: string }[];
}

function buildTeamFromSlug(slug: string): EsportsTeam | null {
  if (!isBsc2026ActiveTeam(slug)) return null;

  const from2026 = getTeams2026().find((t) => t.slug === slug);
  const reg = getBsc2026TeamEntry(slug);
  const curated = CURATED_TEAMS[slug];
  const roster2026 = BSC_2026_ROSTERS[slug];

  if (!from2026 && !reg && !roster2026?.length) return null;

  const bscRegion = getBsc2026TeamRegion(slug);
  const page = reg?.liquipediaPage ?? from2026?.liquipediaPage ?? slug.replace(/-/g, "_");
  const base: EsportsTeam = {
    slug,
    name: reg?.name ?? from2026?.name ?? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    tag: reg?.tag ?? from2026?.tag ?? slug.slice(0, 3).toUpperCase(),
    region: bscRegion ?? reg?.region ?? from2026?.region ?? "GLOBAL",
    country: reg?.country ?? from2026?.country ?? "",
    earnings: from2026?.earnings ?? 0,
    rank: from2026?.rank ?? 99,
    rankChange: from2026?.rankChange ?? 0,
    form: (from2026?.form?.length ? from2026.form : ["W", "L", "W"]) as ("W" | "L")[],
    liquipediaUrl: toLiquipediaUrl(page),
    roster: roster2026?.length ? roster2026 : (from2026?.roster ?? reg?.roster ?? []),
    achievements: from2026?.achievements ?? [],
  };

  const merged = curated ? { ...base, ...curated, liquipediaUrl: base.liquipediaUrl } : base;
  if (roster2026?.length) {
    return { ...merged, region: bscRegion ?? reg?.region ?? merged.region, roster: roster2026 };
  }
  if (reg) {
    return {
      ...merged,
      name: reg.name,
      tag: reg.tag,
      region: bscRegion ?? reg.region,
      roster: reg.roster,
    };
  }
  if (bscRegion) {
    return { ...merged, region: bscRegion };
  }
  return merged;
}

function buildTeams(): EsportsTeam[] {
  const list: EsportsTeam[] = [];
  for (const slug of BSC_2026_ACTIVE_TEAM_SLUGS) {
    const team = buildTeamFromSlug(slug);
    if (team) list.push(team);
  }

  return list.sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    return a.name.localeCompare(b.name);
  });
}

export const teams: EsportsTeam[] = buildTeams();

export function getTeam(slug: string): EsportsTeam | undefined {
  return teams.find((t) => t.slug === slug);
}

export function getTeamByTag(tag: string): EsportsTeam | undefined {
  return teams.find((t) => t.tag.toLowerCase() === tag.toLowerCase());
}

export function isTeam2026(slug: string): boolean {
  return isBsc2026ActiveTeam(slug) || !!getTeams2026().find((t) => t.slug === slug);
}

export { BSC_2026_TEAM_REGISTRY };
