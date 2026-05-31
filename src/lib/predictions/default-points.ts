import type { MatchPredictionPoints } from "@/lib/data/match-meta";

/** Puntos por defecto si el admin no configura el partido. */
export const DEFAULT_MATCH_PREDICTION_POINTS: Required<
  Pick<
    MatchPredictionPoints,
    | "winner"
    | "exact_score"
    | "mvp"
    | "map_winner"
    | "map_pick"
    | "brawler_ban"
    | "brawler_mvp"
    | "brawler_most_used"
    | "brawler_most_banned"
    | "brawler_lowest_wr"
    | "participation"
    | "perfect_bonus"
  >
> = {
  winner: 55,
  exact_score: 50,
  mvp: 40,
  map_winner: 25,
  map_pick: 15,
  brawler_ban: 30,
  brawler_mvp: 35,
  brawler_most_used: 30,
  brawler_most_banned: 30,
  brawler_lowest_wr: 25,
  participation: 10,
  perfect_bonus: 50,
};

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
