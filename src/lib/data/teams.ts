import type { Region } from "../types";
import { toLiquipediaUrl } from "./catalog";
import { getTeams2026, isTeam2026 } from "./teams-2026";
import { getBsc2026PlayedTeamSlugs } from "./bsc-teams-played-2026";
import { BSC_2026_ROSTERS } from "./bsc-2026-rosters";
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

function buildTeams(): EsportsTeam[] {
  const played = getBsc2026PlayedTeamSlugs();
  const list = getTeams2026()
    .filter((t) => played.has(t.slug))
    .map((t) => {
    const curated = CURATED_TEAMS[t.slug];
    const base: EsportsTeam = {
      slug: t.slug,
      name: t.name,
      tag: t.tag,
      region: t.region,
      country: t.country,
      earnings: t.earnings,
      rank: t.rank,
      rankChange: t.rankChange ?? 0,
      form: (t.form?.length ? t.form : ["W", "L", "W"]) as ("W" | "L")[],
      liquipediaUrl: toLiquipediaUrl(t.liquipediaPage),
      roster: t.roster ?? [],
      achievements: t.achievements ?? [],
    };
    const roster2026 = BSC_2026_ROSTERS[t.slug];
    const merged = curated ? { ...base, ...curated, liquipediaUrl: base.liquipediaUrl } : base;
    if (roster2026?.length) {
      return { ...merged, roster: roster2026 };
    }
    return merged;
  });

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

export { isTeam2026 };
