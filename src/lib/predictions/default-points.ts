import type { MatchPredictionPoints } from "@/lib/data/match-meta";
import { DEFAULT_MATCH_PREDICTION_POINTS } from "./match-prediction-defaults";

export { DEFAULT_MATCH_PREDICTION_POINTS };

export function resolveMatchPoints(metaPoints: MatchPredictionPoints): MatchPredictionPoints {
  const d = DEFAULT_MATCH_PREDICTION_POINTS;
  return {
    winner: metaPoints.winner ?? d.winner,
    exact_score: metaPoints.exact_score ?? d.exact_score,
    mvp: metaPoints.mvp ?? d.mvp,
    map_winner: metaPoints.map_winner ?? d.map_winner,
    map_pick: metaPoints.map_pick ?? d.map_pick,
    brawler_ban: metaPoints.brawler_ban ?? d.brawler_ban,
    brawler_mvp: metaPoints.brawler_mvp ?? d.brawler_mvp,
    brawler_most_used: metaPoints.brawler_most_used ?? d.brawler_most_used,
    brawler_most_banned: metaPoints.brawler_most_banned ?? d.brawler_most_banned,
    brawler_lowest_wr: metaPoints.brawler_lowest_wr ?? d.brawler_lowest_wr,
    participation: metaPoints.participation ?? d.participation,
    perfect_bonus: metaPoints.perfect_bonus ?? d.perfect_bonus,
  };
}
