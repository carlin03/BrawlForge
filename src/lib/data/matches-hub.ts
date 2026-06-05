import type { Region } from "../types";
import type { EsportsMatch } from "./matches";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { expandTournamentSlugFilter, getTournament } from "./matches";
import { isPublicScheduleMatch, isPublicUpcomingCalendarMatch } from "./match-schedule-trust";
import { resolveMatchTeamName } from "./team-display-resolve";
import { getMatchStageMeta, type StageRoundKey } from "./match-stage-meta";

function tournamentName(slug: string): string {
  return getTournament(slug)?.shortName ?? slug;
}

function teamName(m: EsportsMatch, side: "A" | "B"): string {
  return resolveMatchTeamName(m, side);
}

export type MatchTab = "live" | "upcoming" | "results";

export type MatchHubFilters = {
  tab: MatchTab;
  region: Region | "all";
  tournamentSlug: string;
  query: string;
};

const ROUND_SORT: Record<StageRoundKey, number> = {
  group: 10,
  last_chance: 20,
  other: 30,
  quarter: 40,
  semi: 50,
  final: 60,
  grand_final: 70,
};

function stageSortIndex(m: EsportsMatch): number {
  return ROUND_SORT[getMatchStageMeta(m.stage).roundKey] ?? 30;
}

function compareHubMatches(a: EsportsMatch, b: EsportsMatch, tab: MatchTab): number {
  const stageA = stageSortIndex(a);
  const stageB = stageSortIndex(b);
  const ta = new Date(a.date).getTime();
  const tb = new Date(b.date).getTime();

  if (tab === "results") {
    if (tb !== ta) return tb - ta;
    if (stageB !== stageA) return stageB - stageA;
    return b.id.localeCompare(a.id);
  }

  if (stageA !== stageB) return stageA - stageB;
  if (ta !== tb) return ta - tb;
  return a.id.localeCompare(b.id);
}

function tabPool(tab: MatchTab, all: EsportsMatch[]): EsportsMatch[] {
  if (tab === "live") return all.filter((m) => getEffectiveMatchStatus(m) === "live");
  if (tab === "upcoming") return all.filter((m) => getEffectiveMatchStatus(m) === "upcoming");
  return all.filter((m) => {
    const s = getEffectiveMatchStatus(m);
    return s === "finished" || s === "cancelled";
  });
}

function matchSearchHaystack(m: EsportsMatch): string {
  const stageMeta = getMatchStageMeta(m.stage);
  return [
    teamName(m, "A"),
    teamName(m, "B"),
    m.teamASlug,
    m.teamBSlug,
    tournamentName(m.tournamentSlug),
    m.stage,
    stageMeta.label,
    stageMeta.fullLabel,
    m.format,
  ]
    .join(" ")
    .toLowerCase();
}

function matchSortScore(m: EsportsMatch): number {
  let s = 0;
  if (getEffectiveMatchStatus(m) === "live") s += 100;
  if (m.tournamentSlug.includes("bsc") || m.tournamentSlug.includes("world-finals")) s += 40;
  const rk = getMatchStageMeta(m.stage).roundKey;
  if (rk === "grand_final") s += 30;
  else if (rk === "semi") s += 24;
  else if (rk === "quarter") s += 18;
  else if (rk === "final") s += 16;
  return s;
}

export function sortHubMatchList(list: EsportsMatch[], tab: MatchTab = "upcoming"): EsportsMatch[] {
  return [...list].sort((a, b) => compareHubMatches(a, b, tab));
}

export function filterHubMatches(all: EsportsMatch[], filters: MatchHubFilters): EsportsMatch[] {
  const q = filters.query.trim().toLowerCase();
  const scope =
    filters.tab === "results"
      ? all.filter(isPublicScheduleMatch)
      : all.filter(isPublicUpcomingCalendarMatch);
  let pool = tabPool(filters.tab, scope).filter((m) =>
    filters.tab === "results" ? isPublicScheduleMatch(m) : isPublicUpcomingCalendarMatch(m),
  );

  if (filters.region !== "all") {
    pool = pool.filter((m) => m.region === filters.region);
  }
  if (filters.tournamentSlug !== "all") {
    const slugs = new Set(expandTournamentSlugFilter(filters.tournamentSlug));
    pool = pool.filter((m) => slugs.has(m.tournamentSlug));
  }
  if (q) {
    pool = pool.filter((m) => matchSearchHaystack(m).includes(q));
  }

  return pool.sort((a, b) => {
    const pri = matchSortScore(b) - matchSortScore(a);
    if (pri !== 0) return pri;
    return compareHubMatches(a, b, filters.tab);
  });
}

export type MatchTournamentGroup = {
  tournamentSlug: string;
  label: string;
  region: Region;
  matches: EsportsMatch[];
};

export type MatchPlayoffSection = {
  roundKey: StageRoundKey;
  label: string;
  matches: EsportsMatch[];
};

/** Agrupa partidos de un torneo por ronda (cuartos → semis → final) para el hub. */
export function playoffSectionsForMatches(
  matches: EsportsMatch[],
  tab: MatchTab,
): MatchPlayoffSection[] {
  const order: StageRoundKey[] = [
    "group",
    "last_chance",
    "other",
    "quarter",
    "semi",
    "final",
    "grand_final",
  ];
  const buckets = new Map<StageRoundKey, EsportsMatch[]>();
  for (const m of matches) {
    const key = getMatchStageMeta(m.stage).roundKey;
    const arr = buckets.get(key) ?? [];
    arr.push(m);
    buckets.set(key, arr);
  }
  return order
    .filter((k) => (buckets.get(k)?.length ?? 0) > 0)
    .map((roundKey) => {
      const list = buckets.get(roundKey)!;
      const sorted = [...list].sort((a, b) => compareHubMatches(a, b, tab));
      const label = getMatchStageMeta(sorted[0]!.stage).fullLabel;
      return { roundKey, label, matches: sorted };
    });
}

export function groupMatchesByTournament(list: EsportsMatch[], tab: MatchTab = "upcoming"): MatchTournamentGroup[] {
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
      matches: [...matches].sort((a, b) => compareHubMatches(a, b, tab)),
    }))
    .sort((a, b) => {
      const da = new Date(a.matches[0]?.date ?? 0).getTime();
      const db = new Date(b.matches[0]?.date ?? 0).getTime();
      return tab === "results" ? db - da : da - db;
    });
}

export function countHubMatches(all: EsportsMatch[]) {
  const confirmed = all.filter(isPublicScheduleMatch);
  const scheduled = all.filter(isPublicUpcomingCalendarMatch);
  return {
    live: scheduled.filter((m) => getEffectiveMatchStatus(m) === "live").length,
    upcoming: scheduled.filter((m) => getEffectiveMatchStatus(m) === "upcoming").length,
    results: confirmed.filter((m) => {
      const s = getEffectiveMatchStatus(m);
      return s === "finished" || s === "cancelled";
    }).length,
    total: confirmed.length,
  };
}

/** Pestaña inicial: si no hay directo ni próximos, abrir Resultados (evita calendario vacío). */
export function defaultMatchHubTab(counts: {
  live: number;
  upcoming: number;
  results: number;
}): MatchTab {
  if (counts.live > 0) return "live";
  if (counts.upcoming > 0) return "upcoming";
  if (counts.results > 0) return "results";
  return "upcoming";
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
