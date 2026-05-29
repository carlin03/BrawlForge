"use client";

import { useMemo } from "react";
import Link from "next/link";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { FeaturedPredictionDuel } from "@/components/platform/predictions/FeaturedPredictionDuel";
import { PredictionsCompactHero } from "@/components/platform/predictions/PredictionsCompactHero";
import { MyPredictionsMini } from "@/components/platform/predictions/MyPredictionsMini";
import { PredictionsPopularRails } from "@/components/platform/predictions/PredictionsPopularRails";
import { PredictionsHistorySection } from "@/components/platform/predictions/PredictionsHistorySection";
import type { PredictionEvent } from "@/lib/data/predictions";
import { isKnownTeamSlug } from "@/lib/data";
import type { UserGameState } from "@/lib/supabase/game-types";
import {
  categorizePopularPicks,
  enrichPrediction,
  pickFeaturedEvent,
} from "@/lib/data/predictions-ui";
import { useAuth } from "@/contexts/AuthContext";

export function PredictionsView({
  open,
  closed,
  game,
}: {
  open: PredictionEvent[];
  closed: PredictionEvent[];
  game: UserGameState | null;
}) {
  const { isLoggedIn } = useAuth();
  const votes = game?.votes ?? {};

  const displayOpen = useMemo(
    () => open.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)),
    [open],
  );
  const displayClosed = useMemo(
    () => closed.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)),
    [closed],
  );

  const openEnriched = useMemo(
    () => displayOpen.map((e) => enrichPrediction(e, votes)),
    [displayOpen, votes],
  );

  const closedEnriched = useMemo(
    () =>
      [...displayClosed]
        .map((e) => enrichPrediction(e, votes))
        .sort((a, b) => (b.matchDate ?? b.deadline).localeCompare(a.matchDate ?? a.deadline)),
    [displayClosed, votes],
  );

  const featuredEvent = useMemo(() => {
    const f = pickFeaturedEvent(displayOpen);
    return f ? enrichPrediction(f, votes) : null;
  }, [displayOpen, votes]);

  const featuredId = featuredEvent?.matchId;

  const activeList = useMemo(
    () => openEnriched.filter((e) => e.matchId !== featuredId),
    [openEnriched, featuredId],
  );

  const myPicks = useMemo(
    () => openEnriched.concat(closedEnriched).filter((e) => e.userPick),
    [openEnriched, closedEnriched],
  );

  const popularBuckets = useMemo(() => categorizePopularPicks(openEnriched), [openEnriched]);

  return (
    <div className="bf-page-ultra bf-motion-page bf-predict-page bf-predict-bsc bf-predict-pickem">
      <PredictionsCompactHero
        activeCount={displayOpen.length}
        closedCount={displayClosed.length}
        game={game}
      />

      {featuredEvent && <FeaturedPredictionDuel event={featuredEvent} />}

      <section className="bf-predict-active-main" aria-labelledby="predict-active-title">
        <h2 id="predict-active-title" className="bf-predict-pickem-section-title">
          Predicciones activas
          <span className="bf-predict-pickem-count">{displayOpen.length}</span>
        </h2>

        {displayOpen.length === 0 ? (
          <div className="bf-bsc-predict-empty">
            <p>No hay partidos abiertos para predecir ahora.</p>
            <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-ghost">
              Ver calendario
            </Link>
          </div>
        ) : activeList.length === 0 && featuredEvent ? (
          <p className="bf-predict-active-only-featured">
            Solo el destacado de arriba está abierto. Vota antes de que cierre.
          </p>
        ) : (
          <div className="bf-predict-pickem-grid">
            {activeList.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {displayOpen.length > 0 && (
        <PredictionsPopularRails buckets={popularBuckets} excludeId={featuredId} />
      )}

      {isLoggedIn && myPicks.length > 0 && <MyPredictionsMini picks={myPicks} />}

      <PredictionsHistorySection closed={closedEnriched} />
    </div>
  );
}
