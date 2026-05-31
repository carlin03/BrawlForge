import type { EsportsMatch } from "@/lib/data/matches";
import {
  getMatchPredictionsConfig,
  getMatchPredictionPoints,
  parseMatchMeta,
  type MatchMeta,
  type MatchPredictionPoints,
} from "@/lib/data/match-meta";
import { mapCountFromExactScore, resolveMatchMapOrder } from "@/lib/data/series-map-utils";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import { isSameBrawler } from "@/lib/match-predictions-storage";

export type ScoreLine = {
  id: string;
  label: string;
  detail?: string;
  points: number;
  maxPoints: number;
  hit: boolean;
  pending?: boolean;
};

export type MatchPredictionScore = {
  total: number;
  maxPossible: number;
  lines: ScoreLine[];
  winnerCorrect: boolean;
};

function normBrawler(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return isSameBrawler(a, b);
}

function actualExactScore(match: EsportsMatch, meta: MatchMeta): string | undefined {
  const adv = meta.advanced_predictions?.exact_score;
  if (adv) return adv;
  if (match.status !== "finished") return undefined;
  return `${match.scoreA}-${match.scoreB}`;
}

function brawlerHit(pred: string | undefined, actual: string | undefined): boolean {
  return normBrawler(pred, actual);
}

function addLine(
  lines: ScoreLine[],
  id: string,
  label: string,
  max: number,
  hit: boolean,
  detail?: string,
  pending = false,
): void {
  if (max <= 0) return;
  lines.push({
    id,
    label,
    detail,
    points: hit ? max : 0,
    maxPoints: max,
    hit,
    pending,
  });
}

/** Calcula puntos de una predicción frente al resultado del partido. */
export function scoreMatchPrediction(
  match: EsportsMatch,
  pick: "A" | "B",
  ext: MatchExtendedPrediction,
  exactScoreVote?: string | null,
): MatchPredictionScore {
  const meta = parseMatchMeta(match.meta);
  const cfg = getMatchPredictionsConfig(meta);
  const pts = getMatchPredictionPoints(meta);
  const adv = meta.advanced_predictions ?? {};
  const lines: ScoreLine[] = [];

  if (match.status !== "finished") {
    return { total: 0, maxPossible: 0, lines: [], winnerCorrect: false };
  }

  const winner: "A" | "B" = match.scoreA > match.scoreB ? "A" : "B";
  const winnerCorrect = pick === winner;

  if (cfg.winner) {
    addLine(lines, "winner", "Ganador del partido", pts.winner ?? 0, winnerCorrect);
  }

  const actualExact = actualExactScore(match, meta);
  const predictedExact = exactScoreVote ?? ext.exactScore;
  if (cfg.exact_score && actualExact) {
    addLine(
      lines,
      "exact_score",
      "Resultado exacto",
      pts.exact_score ?? 0,
      predictedExact === actualExact,
      `${predictedExact ?? "—"} → ${actualExact}`,
    );
  }

  if (cfg.mvp && adv.mvp_player_slug) {
    addLine(
      lines,
      "mvp",
      "MVP jugador",
      pts.mvp ?? 0,
      ext.mvpPlayerSlug === adv.mvp_player_slug,
      adv.mvp_player_slug,
    );
  }

  const actualWr = adv.match_mvp_brawler ?? meta.brawlers?.recommended?.[0];
  const actualUsed = adv.most_used_brawler ?? meta.brawlers?.most_used?.[0];
  const actualBanned = adv.most_banned_brawler;
  const actualLowWr = adv.lowest_wr_brawler;

  if (cfg.brawler_mvp && actualWr) {
    addLine(
      lines,
      "brawler_mvp",
      "Mayor win rate",
      pts.brawler_mvp ?? 0,
      brawlerHit(ext.brawlerMvp, actualWr),
      actualWr,
    );
  }
  if (cfg.brawler_most_used && actualUsed) {
    addLine(
      lines,
      "brawler_most_used",
      "Brawler más usado (repetido)",
      pts.brawler_most_used ?? 0,
      brawlerHit(ext.brawlerMostUsed, actualUsed),
      actualUsed,
    );
  }
  if (cfg.brawler_most_banned && actualBanned) {
    addLine(
      lines,
      "brawler_most_banned",
      "Brawler más bloqueado",
      pts.brawler_most_banned ?? pts.brawler_ban ?? 0,
      brawlerHit(ext.brawlerMostBanned, actualBanned),
      actualBanned,
    );
  }
  if (cfg.brawler_lowest_wr && actualLowWr) {
    addLine(
      lines,
      "brawler_lowest_wr",
      "Menor win rate",
      pts.brawler_lowest_wr ?? 0,
      brawlerHit(ext.brawlerLowestWr, actualLowWr),
      actualLowWr,
    );
  }

  const mapOrder = resolveMatchMapOrder(meta, match.format);
  const mapResults = adv.map_results ?? {};
  const playedCount =
    mapCountFromExactScore(actualExact ?? predictedExact, match.format) ?? mapOrder.length;

  if (cfg.map_winners && mapOrder.length) {
    for (let i = 0; i < Math.min(playedCount, mapOrder.length); i++) {
      const res = mapResults[String(i)] ?? mapResults[i];
      const actualWinner = res?.winner;
      const predWinner = ext.mapWinners?.[i];
      if (!actualWinner) continue;
      addLine(
        lines,
        `map_winner_${i}`,
        `Ganador mapa ${i + 1}`,
        pts.map_winner ?? 0,
        predWinner === actualWinner,
        mapOrder[i],
      );
    }
  }

  if (cfg.map_brawler_picks && mapOrder.length) {
    for (let i = 0; i < Math.min(playedCount, mapOrder.length); i++) {
      const res = mapResults[String(i)] ?? mapResults[i];
      if (!res) continue;
      const pred = ext.mapBrawlerPicks?.[i];
      const pickPts = pts.map_pick ?? 0;
      const banPts = pts.brawler_ban ?? 0;

      for (const name of res.picks_a ?? []) {
        if (pred?.a?.some((p) => isSameBrawler(p, name))) {
          addLine(lines, `map_${i}_pick_a_${name}`, `Pick A · mapa ${i + 1}`, pickPts, true, name);
        }
      }
      for (const name of res.picks_b ?? []) {
        if (pred?.b?.some((p) => isSameBrawler(p, name))) {
          addLine(lines, `map_${i}_pick_b_${name}`, `Pick B · mapa ${i + 1}`, pickPts, true, name);
        }
      }
      const predCentral = ext.mapBrawlerBans?.[i] ?? [];
      const predTeam = ext.mapTeamBans?.[i];
      for (const name of res.central_bans ?? []) {
        if (predCentral.some((p) => isSameBrawler(p, name))) {
          addLine(lines, `map_${i}_ban_c_${name}`, `Ban central · mapa ${i + 1}`, banPts, true, name);
        }
      }
      for (const name of res.team_bans_a ?? []) {
        if (predTeam?.a?.some((p) => isSameBrawler(p, name))) {
          addLine(lines, `map_${i}_ban_ta_${name}`, `Ban equipo A · mapa ${i + 1}`, banPts, true, name);
        }
      }
      for (const name of res.team_bans_b ?? []) {
        if (predTeam?.b?.some((p) => isSameBrawler(p, name))) {
          addLine(lines, `map_${i}_ban_tb_${name}`, `Ban equipo B · mapa ${i + 1}`, banPts, true, name);
        }
      }
    }
  }

  const partPts = pts.participation ?? 0;
  if (partPts > 0 && pick) {
    addLine(lines, "participation", "Participar en el partido", partPts, true);
  }

  const allScored = lines.filter((l) => !l.pending && l.maxPoints > 0);
  const allHits =
    allScored.length > 0 && allScored.every((l) => l.hit) && winnerCorrect;
  if (allHits && (pts.perfect_bonus ?? 0) > 0) {
    addLine(lines, "perfect_bonus", "Bonus predicción perfecta", pts.perfect_bonus ?? 0, true);
  }

  const total = lines.reduce((s, l) => s + l.points, 0);
  const maxPossible = lines.reduce((s, l) => s + l.maxPoints, 0);

  return { total, maxPossible, lines, winnerCorrect };
}

export function estimateLivePoints(
  match: EsportsMatch,
  meta: MatchMeta,
  ext: MatchExtendedPrediction,
  pick: "A" | "B" | null,
  exactScoreVote?: string | null,
): { maxPossible: number; configured: MatchPredictionPoints } {
  if (!pick) return { maxPossible: 0, configured: getMatchPredictionPoints(meta) };
  const cfg = getMatchPredictionsConfig(meta);
  const pts = getMatchPredictionPoints(meta);
  let max = 0;
  if (cfg.winner) max += pts.winner ?? 0;
  if (cfg.exact_score && (ext.exactScore || exactScoreVote)) max += pts.exact_score ?? 0;
  if (cfg.mvp && ext.mvpPlayerSlug) max += pts.mvp ?? 0;
  if (cfg.brawler_mvp && ext.brawlerMvp) max += pts.brawler_mvp ?? 0;
  if (cfg.brawler_most_used && ext.brawlerMostUsed) max += pts.brawler_most_used ?? 0;
  if (cfg.brawler_most_banned && ext.brawlerMostBanned) max += pts.brawler_most_banned ?? pts.brawler_ban ?? 0;
  if (cfg.brawler_lowest_wr && ext.brawlerLowestWr) max += pts.brawler_lowest_wr ?? 0;
  const mapOrder = resolveMatchMapOrder(meta, match.format);
  const n =
    mapCountFromExactScore(ext.exactScore ?? exactScoreVote ?? undefined, match.format) ??
    mapOrder.length;
  if (cfg.map_winners) max += (pts.map_winner ?? 0) * n;
  if (cfg.map_brawler_picks) max += (pts.map_pick ?? 0) * 6 * n + (pts.brawler_ban ?? 0) * 8 * n;
  max += pts.participation ?? 0;
  if (cfg.winner) max += pts.perfect_bonus ?? 0;
  return { maxPossible: max, configured: pts };
}
