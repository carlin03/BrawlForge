"use client";

import { useEffect, useMemo } from "react";
import { PredictionsView } from "@/components/platform/PredictionsView";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";

export function PredictionsPageClient() {
  const { ready, aggregates, game } = useGame();
  const { refreshProfile } = useAuth();

  const { open, closed } = useMemo(
    () => buildPredictionEvents(aggregates, game?.votes ?? {}),
    [aggregates, game?.votes],
  );

  useEffect(() => {
    if (ready && game) void refreshProfile();
  }, [ready, game?.predictPoints, game?.predictStreak, refreshProfile]);

  if (!ready) {
    return <div className="bf-auth-page">Cargando predicciones…</div>;
  }

  return <PredictionsView open={open} closed={closed} game={game} />;
}
