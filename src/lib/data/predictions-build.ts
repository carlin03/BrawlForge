import { getRecentMatches, getUpcomingMatches } from "./matches";
import type { PredictionEvent } from "./predictions";
import type { VoteAggregate } from "@/lib/supabase/game-types";

function pct(votes: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((votes / total) * 100);
}

export function buildPredictionEvents(
  aggregates: Record<string, VoteAggregate>,
  userVotes: Record<string, "A" | "B"> = {},
): { open: PredictionEvent[]; closed: PredictionEvent[] } {
  const upcoming = getUpcomingMatches();
  const open: PredictionEvent[] = upcoming.map((m, i) => {
    const agg = aggregates[m.id];
    const total = agg?.total_votes ?? 0;
    const pickA = pct(agg?.votes_a ?? 0, total);
    return {
      id: `vota-${m.id}-${i}`,
      matchId: m.id,
      teamASlug: m.teamASlug,
      teamBSlug: m.teamBSlug,
      pickAPct: pickA,
      pickBPct: 100 - pickA,
      totalVotes: total,
      rewardPoints: m.format.includes("5") ? 75 : m.format.includes("3") ? 50 : 35,
      featured: i < 3,
      userPick: userVotes[m.id] ?? null,
      status: "open" as const,
      stage: m.stage,
      tournamentSlug: m.tournamentSlug,
      deadline: m.date,
    };
  });

  const recent = getRecentMatches(24);
  const closed: PredictionEvent[] = recent.map((m, i) => {
    const correct: "A" | "B" = m.scoreA > m.scoreB ? "A" : "B";
    const agg = aggregates[m.id];
    const total = agg?.total_votes ?? 0;
    const pickA = pct(agg?.votes_a ?? 0, total);
    return {
      id: `vota-closed-${m.id}`,
      matchId: m.id,
      teamASlug: m.teamASlug,
      teamBSlug: m.teamBSlug,
      pickAPct: pickA,
      pickBPct: 100 - pickA,
      totalVotes: total,
      rewardPoints: 50,
      deadline: m.date,
      stage: m.stage,
      tournamentSlug: m.tournamentSlug,
      status: "closed" as const,
      correctPick: correct,
      userPick: userVotes[m.id] ?? null,
    };
  });

  return { open, closed };
}

export function hasRealVotes(event: PredictionEvent): boolean {
  return event.totalVotes > 0;
}
