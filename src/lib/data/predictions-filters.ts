import { teamName } from "./index";
import type { EnrichedPrediction, PlayoffBracketView } from "./predictions-ui";

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

export function predictionMatchesSearch(e: EnrichedPrediction, query: string): boolean {
  const s = query.trim().toLowerCase();
  if (!s) return true;
  const tour = `${e.tournamentShortName ?? ""} ${e.tournamentSlug}`.toLowerCase();
  const a = `${e.teamASlug} ${teamName(e.teamASlug)}`.toLowerCase();
  const b = `${e.teamBSlug} ${teamName(e.teamBSlug)}`.toLowerCase();
  const stage = (e.stage ?? "").toLowerCase();
  return tour.includes(s) || a.includes(s) || b.includes(s) || stage.includes(s);
}
