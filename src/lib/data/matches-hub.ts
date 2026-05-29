import type { Region } from "../types";
import type { EsportsMatch } from "./matches";
import { getTournament, isDisplayableMatch } from "./matches";
import { getTeam } from "./teams";

function tournamentName(slug: string): string {
  return getTournament(slug)?.shortName ?? slug;
}

function teamName(slug: string): string {
  return getTeam(slug)?.name ?? slug;
}

export type MatchTab = "live" | "upcoming" | "results";

export type MatchHubFilters = {
  tab: MatchTab;
  region: Region | "all";
  tournamentSlug: string;
  query: string;
};

function tabPool(tab: MatchTab, all: EsportsMatch[]): EsportsMatch[] {
  if (tab === "live") return all.filter((m) => m.status === "live");
  if (tab === "upcoming") return all.filter((m) => m.status === "upcoming");
  return all.filter((m) => m.status === "finished");
}

function matchSearchHaystack(m: EsportsMatch): string {
  return [
    teamName(m.teamASlug),
    teamName(m.teamBSlug),
    m.teamASlug,
    m.teamBSlug,
    tournamentName(m.tournamentSlug),
    m.stage,
    m.format,
  ]
    .join(" ")
    .toLowerCase();
}

function matchSortScore(m: EsportsMatch): number {
  let s = 0;
  if (m.status === "live") s += 100;
  if (m.tournamentSlug.includes("bsc") || m.tournamentSlug.includes("world-finals")) s += 40;
  if (/final|semifinal|quarter/i.test(m.stage)) s += 20;
  return s;
}

export function filterHubMatches(all: EsportsMatch[], filters: MatchHubFilters): EsportsMatch[] {
  const q = filters.query.trim().toLowerCase();
  let pool = tabPool(filters.tab, all).filter(isDisplayableMatch);

  if (filters.region !== "all") {
    pool = pool.filter((m) => m.region === filters.region);
  }
  if (filters.tournamentSlug !== "all") {
    pool = pool.filter((m) => m.tournamentSlug === filters.tournamentSlug);
  }
  if (q) {
    pool = pool.filter((m) => matchSearchHaystack(m).includes(q));
  }

  return pool.sort((a, b) => {
    const pri = matchSortScore(b) - matchSortScore(a);
    if (pri !== 0) return pri;
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    return filters.tab === "results" ? tb - ta : ta - tb;
  });
}

export type MatchTournamentGroup = {
  tournamentSlug: string;
  label: string;
  region: Region;
  matches: EsportsMatch[];
};

export function groupMatchesByTournament(list: EsportsMatch[]): MatchTournamentGroup[] {
  const map = new Map<string, EsportsMatch[]>();
  for (const m of list) {
    const arr = map.get(m.tournamentSlug) ?? [];
    arr.push(m);
    map.set(m.tournamentSlug, arr);
  }
  return [...map.entries()]
    .map(([tournamentSlug, matches]) => ({
      tournamentSlug,
      label: tournamentName(tournamentSlug),
      region: matches[0]?.region ?? "GLOBAL",
      matches,
    }))
    .sort((a, b) => {
      const da = new Date(a.matches[0]?.date ?? 0).getTime();
      const db = new Date(b.matches[0]?.date ?? 0).getTime();
      return db - da;
    });
}

export function countHubMatches(all: EsportsMatch[]) {
  const display = all.filter(isDisplayableMatch);
  return {
    live: display.filter((m) => m.status === "live").length,
    upcoming: display.filter((m) => m.status === "upcoming").length,
    results: display.filter((m) => m.status === "finished").length,
    total: display.length,
  };
}

export function tournamentsInMatches(list: EsportsMatch[]): { slug: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of list) {
    counts.set(m.tournamentSlug, (counts.get(m.tournamentSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: tournamentName(slug), count }))
    .sort((a, b) => b.count - a.count);
}
