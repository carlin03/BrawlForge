import type { MatchMeta } from "./match-meta";
import { parseMatchMeta } from "./match-meta";
import { resolveMatchMapOrder } from "./series-map-utils";
import { visiblePredictionMapSlots } from "./series-map-utils";
import { scoreToExactString } from "./match-format-rules";
import type { EsportsMatch } from "./esports-match-types";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

export function finishedExactScore(match: EsportsMatch): string {
  return scoreToExactString(match.scoreA, match.scoreB);
}

export function extFromFinishedResults(
  match: EsportsMatch,
  meta: MatchMeta,
): MatchExtendedPrediction {
  const parsed = parseMatchMeta(meta);
  const results = parsed.advanced_predictions?.map_results ?? {};
  const mapWinners: Record<number, "A" | "B"> = {};
  const mapBrawlerPicks: MatchExtendedPrediction["mapBrawlerPicks"] = {};
  const mapBrawlerBans: Record<number, string[]> = {};
  const mapTeamBans: MatchExtendedPrediction["mapTeamBans"] = {};

  for (const [idx, row] of Object.entries(results)) {
    const i = Number(idx);
    if (row.winner) mapWinners[i] = row.winner;
    if (row.picks_a?.length || row.picks_b?.length) {
      mapBrawlerPicks[i] = { a: row.picks_a ?? [], b: row.picks_b ?? [] };
    }
    if (row.central_bans?.length) mapBrawlerBans[i] = row.central_bans;
    if (row.team_bans_a?.length || row.team_bans_b?.length) {
      mapTeamBans[i] = { a: row.team_bans_a ?? [], b: row.team_bans_b ?? [] };
    }
  }

  return {
    exactScore: finishedExactScore(match),
    mapWinners,
    mapBrawlerPicks,
    mapBrawlerBans,
    mapTeamBans,
    brawlerMostUsed: parsed.advanced_predictions?.most_used_brawler,
    brawlerMvp: parsed.advanced_predictions?.match_mvp_brawler,
    brawlerMostBanned: parsed.advanced_predictions?.most_banned_brawler,
    brawlerLowestWr: parsed.advanced_predictions?.lowest_wr_brawler,
  };
}

export function playedMapSlotsForFinished(match: EsportsMatch, meta: MatchMeta) {
  const order = resolveMatchMapOrder(meta, match.format);
  const exact = finishedExactScore(match);
  return visiblePredictionMapSlots(order, exact, meta.maps?.decisive, match.format);
}
