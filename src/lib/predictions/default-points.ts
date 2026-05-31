import type { MatchPredictionPoints } from "@/lib/data/match-meta";
import { DEFAULT_MATCH_PREDICTION_POINTS } from "./match-prediction-defaults";

export { DEFAULT_MATCH_PREDICTION_POINTS };

function pickPoint(value: number | undefined, fallback: number): number {
  return value != null && value > 0 ? value : fallback;
}

/** Corrige configs viejas donde ganador y exacto tenían casi los mismos puntos. */
function normalizeLegacyWinnerExact(
  points: MatchPredictionPoints,
  defaults: typeof DEFAULT_MATCH_PREDICTION_POINTS,
): MatchPredictionPoints {
  const w = points.winner ?? 0;
  const e = points.exact_score ?? 0;
  if (w <= 0 || e <= 0) return points;
  if (Math.abs(e - w) > 12) return points;
  return {
    ...points,
    winner: defaults.winner,
    exact_score: defaults.exact_score,
  };
}

export function resolveMatchPoints(metaPoints: MatchPredictionPoints): MatchPredictionPoints {
  const d = DEFAULT_MATCH_PREDICTION_POINTS;
  const merged: MatchPredictionPoints = {
    winner: pickPoint(metaPoints.winner, d.winner),
    exact_score: pickPoint(metaPoints.exact_score, d.exact_score),
    mvp: pickPoint(metaPoints.mvp, d.mvp),
    map_winner: pickPoint(metaPoints.map_winner, d.map_winner),
    map_pick: pickPoint(metaPoints.map_pick, d.map_pick),
    brawler_ban: pickPoint(metaPoints.brawler_ban, d.brawler_ban),
    brawler_mvp: pickPoint(metaPoints.brawler_mvp, d.brawler_mvp),
    brawler_most_used: pickPoint(metaPoints.brawler_most_used, d.brawler_most_used),
    brawler_most_banned: pickPoint(metaPoints.brawler_most_banned, d.brawler_most_banned),
    brawler_lowest_wr: pickPoint(metaPoints.brawler_lowest_wr, d.brawler_lowest_wr),
    participation: pickPoint(metaPoints.participation, d.participation),
    perfect_bonus: pickPoint(metaPoints.perfect_bonus, d.perfect_bonus),
  };
  return normalizeLegacyWinnerExact(merged, d);
}
