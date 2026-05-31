"use client";

import { useEffect, useMemo, useState } from "react";
import { PredictionsView } from "@/components/platform/PredictionsView";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";
import type { PlayoffBracketsStore } from "@/lib/data/bracket-config";

export function PredictionsPageClient() {
  const { ready, aggregates, game, refresh } = useGame();
  const [brackets, setBrackets] = useState<PlayoffBracketsStore>({});

  useEffect(() => {
    const sync = () => void refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  useEffect(() => {
    fetch("/api/brackets")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.brackets) setBrackets(data.brackets as PlayoffBracketsStore);
      })
      .catch(() => {});
  }, []);

  const votesKey = useMemo(() => JSON.stringify(game?.votes ?? {}), [game?.votes]);
  const bracketsKey = useMemo(() => JSON.stringify(brackets), [brackets]);

  const { open, closed } = useMemo(
    () => buildPredictionEvents(aggregates, game?.votes ?? {}, brackets),
    [aggregates, votesKey, bracketsKey],
  );

  const hasData = open.length > 0 || closed.length > 0 || Object.keys(aggregates).length > 0;

  return (
    <>
      {!ready && !hasData && (
        <div className="bf-auth-page">Cargando predicciones…</div>
      )}
      {(ready || hasData) && (
        <PredictionsView
          open={open}
          closed={closed}
          game={game}
          syncing={!ready}
          bracketStore={brackets}
        />
      )}
    </>
  );
}
