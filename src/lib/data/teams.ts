import type { Region } from "../types";
import { getGeneratedTeams, toLiquipediaUrl } from "./catalog";
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
  const list = getGeneratedTeams().map((t) => {
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
    return curated ? { ...base, ...curated, liquipediaUrl: base.liquipediaUrl } : base;
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

export function searchTeams(query: string, limit = 50): EsportsTeam[] {
  const q = query.trim().toLowerCase();
  if (!q) return teams.slice(0, limit);
  return teams
    .filter((t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q) || t.slug.includes(q))
    .slice(0, limit);
}
