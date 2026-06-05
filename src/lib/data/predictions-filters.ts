import { teamName } from "./index";
import {
  filterKeyFromRoundKey,
  filterKeyFromStage,
  type PredictRoundFilterKey,
  PREDICT_ROUND_FILTER_OPTIONS,
} from "./match-round-types";
import type { EnrichedPrediction, PlayoffBracketView } from "./predictions-ui";

export type { PredictRoundFilterKey };
export { PREDICT_ROUND_FILTER_OPTIONS };

export function predictChronologySort(a: EnrichedPrediction, b: EnrichedPrediction): number {
  return (a.matchDate ?? a.deadline).localeCompare(b.matchDate ?? b.deadline);
}

export function bracketEarliestIso(b: PlayoffBracketView): string {
  const all = [...b.quarters, ...b.semis, ...(b.final ? [b.final] : [])];
  if (!all.length) return "";
  return all.map((e) => e.matchDate ?? e.deadline).sort()[0] ?? "";
}

export function sortBracketsByDate(brackets: PlayoffBracketView[]): PlayoffBracketView[] {
  return [...brackets].sort((a, b) => bracketEarliestIso(a).localeCompare(bracketEarliestIso(b)));
}

export type PredictTournamentTab = {
  slug: string;
  name: string;
  earliest: string;
  openCount: number;
};

export function getPredictTournamentTabs(events: EnrichedPrediction[]): PredictTournamentTab[] {
  const map = new Map<string, PredictTournamentTab>();
  for (const e of events) {
    if (e.status !== "open") continue;
    const d = e.matchDate ?? e.deadline;
    const name = e.tournamentShortName ?? e.tournamentSlug;
    const cur = map.get(e.tournamentSlug);
    if (!cur) {
      map.set(e.tournamentSlug, { slug: e.tournamentSlug, name, earliest: d, openCount: 1 });
    } else {
      cur.openCount += 1;
      if (d < cur.earliest) cur.earliest = d;
    }
  }
  return [...map.values()].sort((a, b) => a.earliest.localeCompare(b.earliest));
}

/** Filtros de ronda dinámicos según partidos abiertos del torneo (o global). */
export function getAvailableRoundFilters(
  events: EnrichedPrediction[],
  tournamentSlug?: string | null,
): PredictRoundFilterKey[] {
  const list = tournamentSlug
    ? events.filter((e) => e.tournamentSlug === tournamentSlug)
    : events;
  const keys = new Set<PredictRoundFilterKey>();
  for (const e of list) {
    const fk =
      filterKeyFromStage(e.stage) ??
      filterKeyFromRoundKey(e.stageMeta?.roundKey ?? "other");
    if (fk) keys.add(fk);
  }
  const out: PredictRoundFilterKey[] = ["all"];
  if (keys.has("group")) out.push("group");
  if (keys.has("quarter")) out.push("quarter");
  if (keys.has("semi")) out.push("semi");
  if (keys.has("final")) out.push("final");
  return out;
}

export function eventMatchesRoundFilter(
  e: EnrichedPrediction,
  filter: PredictRoundFilterKey,
): boolean {
  if (filter === "all") return true;
  const fk =
    filterKeyFromStage(e.stage) ??
    filterKeyFromRoundKey(e.stageMeta?.roundKey ?? "other");
  return fk === filter;
}

export function bracketShowsRound(
  bracket: PlayoffBracketView,
  filter: PredictRoundFilterKey,
): { quarters: boolean; semis: boolean; final: boolean } {
  if (filter === "all") return { quarters: true, semis: true, final: true };
  if (filter === "quarter") {
    return { quarters: bracket.quarters.length > 0, semis: false, final: false };
  }
  if (filter === "semi") {
    return {
      quarters: bracket.quarters.length > 0,
      semis: bracket.semis.length > 0,
      final: false,
    };
  }
  if (filter === "final") {
    return {
      quarters: bracket.quarters.length > 0,
      semis: bracket.semis.length > 0,
      final: Boolean(bracket.final),
    };
  }
  return { quarters: false, semis: false, final: false };
}

export function predictionMatchesSearch(e: EnrichedPrediction, query: string): boolean {
  const s = query.trim().toLowerCase();
  if (!s) return true;
  const tour = `${e.tournamentShortName ?? ""} ${e.tournamentSlug}`.toLowerCase();
  const a = `${e.teamASlug} ${teamName(e.teamASlug)}`.toLowerCase();
  const b = `${e.teamBSlug} ${teamName(e.teamBSlug)}`.toLowerCase();
  const stage = (e.stage ?? "").toLowerCase();
  return tour.includes(s) || a.includes(s) || b.includes(s) || stage.includes(s);
}
