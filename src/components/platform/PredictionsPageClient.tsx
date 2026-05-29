"use client";

import { useMemo } from "react";
import { PredictionsView } from "@/components/platform/PredictionsView";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";

export function PredictionsPageClient() {
  const { ready, aggregates, game } = useGame();

  const votesKey = useMemo(() => JSON.stringify(game?.votes ?? {}), [game?.votes]);

  const { open, closed } = useMemo(
    () => buildPredictionEvents(aggregates, game?.votes ?? {}),
    [aggregates, votesKey],
  );

  const hasData = open.length > 0 || closed.length > 0 || Object.keys(aggregates).length > 0;

  return (
    <>
      {!ready && !hasData && (
        <div className="bf-auth-page">Cargando predicciones…</div>
      )}
      {(ready || hasData) && (
        <PredictionsView open={open} closed={closed} game={game} syncing={!ready} />
      )}
    </>
  );
}
