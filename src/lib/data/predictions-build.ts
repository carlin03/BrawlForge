import { mergePickemAggregates } from "./pickem-demo-aggregates";
import { getMatch, getRecentMatches } from "./matches";
import { parseMatchMeta } from "./match-meta";
import { getPickemOpenMatches } from "./pickem-open-matches";
import { DEFAULT_PICKEM_STAGE_POINTS, getPickemRewardPoints } from "./pickem-reward-points";
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
  const merged = mergePickemAggregates(aggregates);
  const upcoming = getPickemOpenMatches();
  const open: PredictionEvent[] = upcoming.map((m, i) => {
    const agg = merged[m.id];
    const total = agg?.total_votes ?? 0;
    const pickA = pct(agg?.votes_a ?? 0, total);
    const rewardPoints = getPickemRewardPoints(m.stage, m.format);
    const matchMeta = parseMatchMeta(getMatch(m.id)?.meta ?? m.meta);
    const importance = matchMeta.importance;
    return {
      id: `vota-${m.id}`,
      matchId: m.id,
      teamASlug: m.teamASlug,
      teamBSlug: m.teamBSlug,
      pickAPct: pickA,
      pickBPct: 100 - pickA,
      totalVotes: total,
      rewardPoints,
      importance,
      featured:
        importance === "week_featured" ||
        importance === "featured" ||
        importance === "historic" ||
        m.stage === "Grand Final" ||
        m.stage === "Semifinal" ||
        (m.stage === "Quarterfinal" && i < 2) ||
        i < 1,
      userPick: userVotes[m.id] ?? null,
      status: "open" as const,
      stage: m.stage,
      tournamentSlug: m.tournamentSlug,
      deadline: m.date,
    };
  });

  const recent = getRecentMatches(24);
  const closed: PredictionEvent[] = recent.map((m) => {
    const correct: "A" | "B" = m.scoreA > m.scoreB ? "A" : "B";
    const agg = merged[m.id];
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
      rewardPoints: getPickemRewardPoints(m.stage, m.format),
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

export { DEFAULT_PICKEM_STAGE_POINTS };
