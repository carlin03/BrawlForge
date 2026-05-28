"use client";

import { useMemo } from "react";
import { PredictionsView } from "@/components/platform/PredictionsView";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";

export function PredictionsPageClient() {
  const { ready, aggregates, game } = useGame();
  const { open, closed } = useMemo(
    () => buildPredictionEvents(aggregates, game?.votes ?? {}),
    [aggregates, game?.votes],
  );

  if (!ready) {
    return <div className="bf-auth-page">Cargando predicciones…</div>;
  }

  return <PredictionsView open={open} closed={closed} />;
}
