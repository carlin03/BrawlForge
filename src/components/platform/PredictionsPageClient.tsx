"use client";

import { useEffect, useMemo, useState } from "react";
import { PredictionsView } from "@/components/platform/PredictionsView";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";
import type { PredictionLeaderboardRow } from "@/lib/supabase/game-types";

export function PredictionsPageClient() {
  const { ready, aggregates, game } = useGame();
  const { refreshProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardRow[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [gapToNext, setGapToNext] = useState<number | null>(null);
  const [aboveRank, setAboveRank] = useState<number | null>(null);

  const { open, closed } = useMemo(
    () => buildPredictionEvents(aggregates, game?.votes ?? {}),
    [aggregates, game?.votes],
  );

  useEffect(() => {
    fetch("/api/predictions/leaderboard?limit=12")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        setMyRank(data.myRank ?? null);
        setGapToNext(data.gapToNext ?? null);
        setAboveRank(data.aboveRank ?? null);
      })
      .catch(() => {
        setLeaderboard([]);
        setMyRank(null);
        setGapToNext(null);
        setAboveRank(null);
      });
  }, [game?.predictPoints]);

  useEffect(() => {
    if (ready && game) void refreshProfile();
  }, [ready, game?.predictPoints, game?.predictStreak, refreshProfile]);

  if (!ready) {
    return <div className="bf-auth-page">Cargando predicciones…</div>;
  }

  return (
    <PredictionsView
      open={open}
      closed={closed}
      game={game}
      leaderboard={leaderboard}
      myRank={myRank}
      gapToNext={gapToNext}
      aboveRank={aboveRank}
    />
  );
}
