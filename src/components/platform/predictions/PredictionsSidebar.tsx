"use client";

import Link from "next/link";
import { Flame, Medal, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import type { PredictionLeaderboardRow } from "@/lib/supabase/game-types";
import {
  computeCurrentPredictStreak,
  predictAccuracy,
  predictLevel,
  type EnrichedPrediction,
} from "@/lib/data/predictions-ui";
import { useAuth } from "@/contexts/AuthContext";
import type { UserGameState } from "@/lib/supabase/game-types";

export function PredictionsSidebar({
  game,
  myRank,
  leaderboard,
  gapToNext,
  aboveRank,
  closedEnriched = [],
}: {
  game: UserGameState | null;
  myRank: number | null;
  leaderboard: PredictionLeaderboardRow[];
  gapToNext?: number | null;
  aboveRank?: number | null;
  closedEnriched?: EnrichedPrediction[];
}) {
  const { isLoggedIn, profile } = useAuth();
  const votes = game?.votes ?? {};
  const points = game?.predictPoints ?? profile?.predictPoints ?? 0;
  const bestStreak = game?.predictStreak ?? profile?.predictStreak ?? 0;
  const currentStreak = computeCurrentPredictStreak(votes, closedEnriched);
  const correct = game?.predictCorrect ?? 0;
  const attempts = game?.predictAttempts ?? 0;
  const accuracy = predictAccuracy(correct, attempts);
  const level = predictLevel(points);

  return (
    <aside className="bf-predict-aside">
      <div className="bf-predict-aside-card is-player">
        <h3>
          <Target size={16} aria-hidden /> Tu progreso
        </h3>
        {!isLoggedIn ? (
          <p className="bf-predict-aside-muted">
            <Link href="/login?next=/predictions">Inicia sesión</Link> para guardar picks, subir de nivel y
            aparecer en el ranking.
          </p>
        ) : (
          <>
            <div className="bf-predict-player-level">
              <span className="bf-predict-level-badge">Nv. {level.level}</span>
              <strong>{level.label}</strong>
              <span className="bf-predict-aside-muted">
                {points} / {level.nextAt} pts al siguiente nivel
              </span>
            </div>
            <div className="bf-predict-player-grid">
              <div>
                <b>{myRank != null ? `#${myRank}` : "—"}</b>
                <span>Ranking global</span>
              </div>
              <div>
                <b>{points}</b>
                <span>Puntos</span>
              </div>
              <div>
                <b>{currentStreak}</b>
                <span>Racha actual</span>
              </div>
              <div>
                <b>{bestStreak}</b>
                <span>Mejor racha</span>
              </div>
              <div>
                <b>{accuracy}%</b>
                <span>Precisión</span>
              </div>
            </div>
            {gapToNext != null && aboveRank != null && (
              <p className="bf-predict-chase-mini">
                <TrendingUp size={14} aria-hidden /> +{gapToNext} pts para #{aboveRank}
              </p>
            )}
            {currentStreak >= 2 && (
              <p className="bf-predict-streak-mini">
                <Flame size={14} aria-hidden /> Racha activa: {currentStreak}
              </p>
            )}
            <p className="bf-predict-aside-muted">
              {correct} aciertos de {attempts} partidos cerrados
            </p>
          </>
        )}
      </div>

      <div className="bf-predict-aside-card">
        <div className="bf-predict-aside-head">
          <h3>
            <Trophy size={16} aria-hidden /> Top predictores
          </h3>
          <Medal size={16} className="bf-predict-aside-icon" aria-hidden />
        </div>
        {leaderboard.length === 0 ? (
          <p className="bf-predict-aside-muted">Aún no hay ranking. Sé el primero en acertar.</p>
        ) : (
          <ol className="bf-predict-lb-list">
            {leaderboard.map((row) => (
              <li key={row.user_id} className={row.rank <= 3 ? `is-top is-r${row.rank}` : ""}>
                <span className="bf-predict-lb-rank">#{row.rank}</span>
                <div className="bf-predict-lb-body">
                  <strong>{row.display_name || row.ign}</strong>
                  <span>
                    {row.predict_points} pts · {predictAccuracy(row.predict_correct, row.predict_attempts)}%
                    {row.predict_streak >= 2 ? ` · racha ${row.predict_streak}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bf-predict-aside-card is-compact">
        <p>
          <Zap size={14} aria-hidden /> Bo5 y finales valen más puntos. Cada pick cuenta para tu racha y tu
          posición global.
        </p>
        <Link href="/matches" className="bf-predict-aside-link">
          <TrendingUp size={14} aria-hidden /> Calendario BSC
        </Link>
      </div>
    </aside>
  );
}
