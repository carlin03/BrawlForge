"use client";

import Link from "next/link";
import { Flame, Medal, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import type { PredictionLeaderboardRow } from "@/lib/supabase/game-types";
import type { UserGameState } from "@/lib/supabase/game-types";
import {
  computeCurrentPredictStreak,
  predictAccuracy,
  predictAchievements,
  predictLevel,
  predictXpProgress,
  weeklyPredictSummary,
  type EnrichedPrediction,
} from "@/lib/data/predictions-ui";
import { useAuth } from "@/contexts/AuthContext";

const ACHIEVEMENT_ICON = {
  target: Target,
  flame: Flame,
  trophy: Trophy,
  zap: Zap,
  medal: Medal,
} as const;

export function PredictionsPlayerHero({
  game,
  myRank,
  gapToNext,
  aboveRank,
  closedEnriched,
}: {
  game: UserGameState | null;
  myRank: number | null;
  gapToNext: number | null;
  aboveRank: number | null;
  closedEnriched: EnrichedPrediction[];
}) {
  const { isLoggedIn, profile } = useAuth();
  const votes = game?.votes ?? {};
  const points = game?.predictPoints ?? profile?.predictPoints ?? 0;
  const bestStreak = game?.predictStreak ?? profile?.predictStreak ?? 0;
  const correct = game?.predictCorrect ?? 0;
  const attempts = game?.predictAttempts ?? 0;
  const accuracy = predictAccuracy(correct, attempts);
  const currentStreak = computeCurrentPredictStreak(votes, closedEnriched);
  const level = predictLevel(points);
  const xpPct = predictXpProgress(points);
  const week = weeklyPredictSummary(votes, closedEnriched);
  const badges = predictAchievements({
    points,
    attempts,
    accuracy,
    currentStreak,
    bestStreak,
    rank: myRank,
  });

  if (!isLoggedIn) {
    return (
      <section className="bf-predict-hero is-guest" aria-labelledby="predict-hero-guest">
        <div className="bf-predict-hero-inner">
          <div>
            <p id="predict-hero-guest" className="bf-predict-hero-kicker">
              Modo competitivo
            </p>
            <h2 className="bf-predict-hero-title">Sube en el ranking de predictores</h2>
            <p className="bf-predict-hero-lead">
              Gana puntos, mantén rachas y compite contra la comunidad BrawlForge en cada partido BSC.
            </p>
          </div>
          <Link href="/login?next=/predictions" className="bf-bsc-btn bf-bsc-btn-red">
            Entrar y competir
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bf-predict-hero" aria-labelledby="predict-hero-title">
      <div className="bf-predict-hero-inner">
        <div className="bf-predict-hero-main">
          <p id="predict-hero-title" className="bf-predict-hero-kicker">
            <Target size={14} aria-hidden /> Mi perfil de predicciones
          </p>
          <div className="bf-predict-hero-level-row">
            <span className="bf-predict-hero-lvl">Nv. {level.level}</span>
            <strong>{level.label}</strong>
            <span className="bf-predict-hero-xp-label">
              {points} / {level.nextAt} XP
            </span>
          </div>
          <div className="bf-predict-hero-xp" aria-hidden>
            <div className="bf-predict-hero-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>

          <div className="bf-predict-hero-stats">
            <div className="bf-predict-hero-stat is-rank">
              <b>{myRank != null ? `#${myRank}` : "—"}</b>
              <span>Ranking global</span>
            </div>
            <div className="bf-predict-hero-stat">
              <b>{week.points}</b>
              <span>Pts esta semana</span>
            </div>
            <div className="bf-predict-hero-stat is-gold">
              <b>{points}</b>
              <span>Puntos totales</span>
            </div>
            <div className="bf-predict-hero-stat">
              <b>{accuracy}%</b>
              <span>Precisión</span>
            </div>
            <div className="bf-predict-hero-stat is-fire">
              <b>{currentStreak}</b>
              <span>Racha actual</span>
            </div>
            <div className="bf-predict-hero-stat">
              <b>{bestStreak}</b>
              <span>Mejor racha</span>
            </div>
            <div className="bf-predict-hero-stat">
              <b>{correct}</b>
              <span>Aciertos</span>
            </div>
          </div>

          {gapToNext != null && aboveRank != null && (
            <p className="bf-predict-hero-chase">
              <TrendingUp size={14} aria-hidden />
              Te faltan <strong>{gapToNext} pts</strong> para alcanzar el puesto #{aboveRank}
            </p>
          )}

          {badges.length > 0 && (
            <ul className="bf-predict-hero-badges">
              {badges.map((b) => {
                const Icon = ACHIEVEMENT_ICON[b.icon];
                return (
                  <li key={b.id}>
                    <Icon size={12} aria-hidden /> {b.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bf-predict-hero-side">
          <div className="bf-predict-hero-ring">
            <span className="bf-predict-hero-ring-val">{accuracy}%</span>
            <span className="bf-predict-hero-ring-lbl">Precisión</span>
          </div>
          {currentStreak >= 2 && (
            <p className="bf-predict-hero-streak-callout">
              <Flame size={16} aria-hidden /> Racha de {currentStreak} — sigue así
            </p>
          )}
          <p className="bf-predict-hero-week">
            <Trophy size={14} aria-hidden /> Semana: {week.correct}/{week.attempts} aciertos
          </p>
        </div>
      </div>
    </section>
  );
}
