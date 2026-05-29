"use client";

import Link from "next/link";
import { predictAccuracy } from "@/lib/data/predictions-ui";
import { useAuth } from "@/contexts/AuthContext";
import type { UserGameState } from "@/lib/supabase/game-types";

export function PredictionsCompactHero({
  activeCount,
  closedCount,
  game,
}: {
  activeCount: number;
  closedCount: number;
  game: UserGameState | null;
}) {
  const { isLoggedIn } = useAuth();
  const correct = game?.predictCorrect ?? 0;
  const attempts = game?.predictAttempts ?? 0;
  const accuracy = predictAccuracy(correct, attempts);

  return (
    <header className="bf-predict-pickem-hero">
      <div className="bf-predict-pickem-hero-main">
        <h1 className="bf-predict-pickem-title">Predicciones</h1>
        <p className="bf-predict-pickem-stats-line">
          <span>
            <b>{activeCount}</b> activas
          </span>
          <span className="bf-predict-pickem-dot">·</span>
          <span>
            <b>{closedCount}</b> cerradas
          </span>
          {isLoggedIn && attempts > 0 && (
            <>
              <span className="bf-predict-pickem-dot">·</span>
              <span>
                Mi precisión: <b>{accuracy}%</b>
              </span>
            </>
          )}
          {isLoggedIn && attempts === 0 && (
            <>
              <span className="bf-predict-pickem-dot">·</span>
              <span className="bf-predict-pickem-muted">Sin picks cerrados aún</span>
            </>
          )}
          {!isLoggedIn && (
            <>
              <span className="bf-predict-pickem-dot">·</span>
              <Link href="/login?next=/predictions" className="bf-predict-pickem-login">
                Entrar para guardar picks
              </Link>
            </>
          )}
        </p>
      </div>
      <Link href="/rankings" className="bf-predict-pickem-rank-link">
        Ver ranking →
      </Link>
    </header>
  );
}
