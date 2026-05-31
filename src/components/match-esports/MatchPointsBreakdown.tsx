"use client";

import { useMemo } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { getMatchPredictionsConfig, getMatchPredictionPoints } from "@/lib/data/match-meta";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import {
  estimateLivePoints,
  scoreMatchPrediction,
} from "@/lib/predictions/match-prediction-scoring";

const RULE_ROWS: { key: string; label: string; getPts: (p: ReturnType<typeof getMatchPredictionPoints>) => number }[] = [
  { key: "winner", label: "Ganador del partido", getPts: (p) => p.winner ?? 0 },
  { key: "exact_score", label: "Resultado exacto", getPts: (p) => p.exact_score ?? 0 },
  { key: "mvp", label: "MVP jugador", getPts: (p) => p.mvp ?? 0 },
  { key: "brawler_mvp", label: "Brawler mayor WR", getPts: (p) => p.brawler_mvp ?? 0 },
  {
    key: "brawler_most_used",
    label: "Brawler más usado (repetido)",
    getPts: (p) => p.brawler_most_used ?? 0,
  },
  { key: "brawler_most_banned", label: "Brawler más bloqueado", getPts: (p) => p.brawler_most_banned ?? p.brawler_ban ?? 0 },
  { key: "brawler_lowest_wr", label: "Brawler menor WR", getPts: (p) => p.brawler_lowest_wr ?? 0 },
  { key: "map_winner", label: "Ganador por mapa", getPts: (p) => p.map_winner ?? 0 },
  { key: "map_pick", label: "Pick correcto (por brawler)", getPts: (p) => p.map_pick ?? 0 },
  { key: "brawler_ban", label: "Ban correcto (por brawler)", getPts: (p) => p.brawler_ban ?? 0 },
  { key: "participation", label: "Participar (voto guardado)", getPts: (p) => p.participation ?? 0 },
  { key: "perfect_bonus", label: "Bonus predicción perfecta", getPts: (p) => p.perfect_bonus ?? 0 },
];

export function MatchPointsBreakdown({
  match,
  meta,
  ext,
  winnerPick,
  exactScoreVote,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
  winnerPick: "A" | "B" | null;
  exactScoreVote?: string | null;
}) {
  const cfg = getMatchPredictionsConfig(meta);
  const points = getMatchPredictionPoints(meta);
  const closed = match.status === "finished";

  const score = useMemo(() => {
    if (!winnerPick || !closed) return null;
    return scoreMatchPrediction(match, winnerPick, ext, exactScoreVote);
  }, [match, winnerPick, ext, exactScoreVote, closed]);

  const estimate = useMemo(
    () => estimateLivePoints(match, meta, ext, winnerPick, exactScoreVote),
    [match, meta, ext, winnerPick, exactScoreVote],
  );

  const enabledRules = RULE_ROWS.filter(({ key }) => {
    if (key === "winner") return cfg.winner;
    if (key === "exact_score") return cfg.exact_score;
    if (key === "mvp") return cfg.mvp;
    if (key === "brawler_mvp") return cfg.brawler_mvp;
    if (key === "brawler_most_used") return cfg.brawler_most_used;
    if (key === "brawler_most_banned") return cfg.brawler_most_banned;
    if (key === "brawler_lowest_wr") return cfg.brawler_lowest_wr;
    if (key === "map_winner") return cfg.map_winners;
    if (key === "map_pick" || key === "brawler_ban") return cfg.map_brawler_picks;
    if (key === "participation") return true;
    if (key === "perfect_bonus") return true;
    return false;
  }).filter((r) => r.getPts(points) > 0);

  if (!enabledRules.length) return null;

  return (
    <section className="bf-points-breakdown" aria-labelledby="bf-points-breakdown-title">
      <header className="bf-points-breakdown-head">
        <h3 id="bf-points-breakdown-title" className="bf-points-breakdown-title">
          Sistema de puntos
        </h3>
        {winnerPick && (
          <p className="bf-points-breakdown-sub">
            {closed ? (
              <>
                Total obtenido: <strong>+{score?.total ?? 0}</strong>
                {score && score.maxPossible > 0 && (
                  <span className="bf-points-breakdown-of"> / {score.maxPossible} posibles</span>
                )}
              </>
            ) : (
              <>
                Máximo estimado si aciertas todo:{" "}
                <strong>+{estimate.maxPossible}</strong>
              </>
            )}
          </p>
        )}
      </header>

      <div className="bf-points-breakdown-rules">
        <p className="bf-points-breakdown-rules-h">Puntos por acierto en este partido</p>
        <ul className="bf-points-breakdown-list">
          {enabledRules.map(({ key, label, getPts }) => (
            <li key={key} className="bf-points-breakdown-rule">
              <span>{label}</span>
              <span className="bf-points-breakdown-pts">+{getPts(points)}</span>
            </li>
          ))}
        </ul>
      </div>

      {closed && score && score.lines.length > 0 && (
        <div className="bf-points-breakdown-result">
          <p className="bf-points-breakdown-rules-h">Tu desglose</p>
          <ul className="bf-points-breakdown-list is-results">
            {score.lines.map((line) => (
              <li
                key={line.id}
                className={`bf-points-breakdown-rule ${line.hit ? "is-hit" : "is-miss"}`}
              >
                <span>
                  {line.label}
                  {line.detail && <em className="bf-points-breakdown-detail"> · {line.detail}</em>}
                </span>
                <span className="bf-points-breakdown-pts">
                  {line.hit ? `+${line.points}` : `0 / +${line.maxPoints}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {closed && score && score.lines.length === 0 && (
        <p className="bf-points-breakdown-hint">
          El admin aún no ha cargado los resultados reales (MVP, brawlers, mapas) en este partido.
          Cuando los publique, se recalcularán tus puntos automáticamente.
        </p>
      )}
    </section>
  );
}
