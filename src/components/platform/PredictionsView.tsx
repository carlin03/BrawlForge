"use client";

import { useMemo } from "react";
import Link from "next/link";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { FeaturedPredictionDuel } from "@/components/platform/predictions/FeaturedPredictionDuel";
import { PredictionsCompactHero } from "@/components/platform/predictions/PredictionsCompactHero";
import { MyPredictionsMini } from "@/components/platform/predictions/MyPredictionsMini";
import { PredictionsPopularRails } from "@/components/platform/predictions/PredictionsPopularRails";
import { PredictionsHistorySection } from "@/components/platform/predictions/PredictionsHistorySection";
import { PredictionsPlayoffBracket } from "@/components/platform/predictions/PredictionsPlayoffBracket";
import { PredictionsClosingSoon } from "@/components/platform/predictions/PredictionsClosingSoon";
import type { PredictionEvent } from "@/lib/data/predictions";
import { isKnownTeamSlug } from "@/lib/data";
import type { UserGameState } from "@/lib/supabase/game-types";
import {
  buildPlayoffBracket,
  categorizePopularPicks,
  enrichPrediction,
  getClosingSoonMatches,
  pickFeaturedEvent,
  pickPlayoffTournamentSlug,
} from "@/lib/data/predictions-ui";
import { stageImportanceSort } from "@/lib/data/match-stage-meta";
import { useAuth } from "@/contexts/AuthContext";

export function PredictionsView({
  open,
  closed,
  game,
  syncing = false,
}: {
  open: PredictionEvent[];
  closed: PredictionEvent[];
  game: UserGameState | null;
  syncing?: boolean;
}) {
  const { isLoggedIn } = useAuth();
  const votesKey = useMemo(() => JSON.stringify(game?.votes ?? {}), [game?.votes]);
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
    () =>
      openEnriched
        .filter((e) => e.matchId !== featuredId)
        .sort(stageImportanceSort),
    [openEnriched, featuredId],
  );

  const keyMatches = useMemo(
    () => activeList.filter((e) => (e.stageMeta?.tier ?? 0) >= 4),
    [activeList],
  );

  const regularMatches = useMemo(
    () => activeList.filter((e) => (e.stageMeta?.tier ?? 0) < 4),
    [activeList],
  );

  const closingSoon = useMemo(() => {
    const ids = new Set([featuredId, ...keyMatches.map((e) => e.matchId)]);
    return getClosingSoonMatches(
      openEnriched.filter((e) => !ids.has(e.matchId)),
      3,
    );
  }, [openEnriched, featuredId, keyMatches]);

  const myPicks = useMemo(
    () => openEnriched.concat(closedEnriched).filter((e) => e.userPick),
    [openEnriched, closedEnriched],
  );

  const popularBuckets = useMemo(() => categorizePopularPicks(openEnriched), [openEnriched]);

  const playoffBracket = useMemo(() => {
    const slug =
      featuredEvent?.tournamentSlug ??
      pickPlayoffTournamentSlug(openEnriched.concat(closedEnriched));
    if (!slug) return null;
    return buildPlayoffBracket(slug, openEnriched.concat(closedEnriched));
  }, [featuredEvent, openEnriched, closedEnriched]);

  return (
    <div className="bf-page-ultra bf-motion-page bf-predict-page bf-predict-bsc bf-predict-pickem">
      <PredictionsCompactHero
        activeCount={displayOpen.length}
        closedCount={displayClosed.length}
        game={game}
      />

      {featuredEvent && <FeaturedPredictionDuel event={featuredEvent} />}

      {playoffBracket && <PredictionsPlayoffBracket bracket={playoffBracket} />}

      {syncing && <p className="bf-predict-sync-banner" aria-live="polite">Actualizando votos…</p>}

      {keyMatches.length > 0 && (
        <section className="bf-predict-key-matches" aria-labelledby="predict-key-title">
          <h2 id="predict-key-title" className="bf-predict-pickem-section-title">
            Partidos clave
            <span className="bf-predict-pickem-count">{keyMatches.length}</span>
          </h2>
          <p className="bf-predict-section-lead">Semifinales, finales y eliminatorias — mayor impacto en el torneo.</p>
          <div className="bf-predict-pickem-grid is-key">
            {keyMatches.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <section className="bf-predict-active-main" aria-labelledby="predict-active-title">
        <h2 id="predict-active-title" className="bf-predict-pickem-section-title">
          Todos los partidos
          <span className="bf-predict-pickem-count">{displayOpen.length}</span>
        </h2>

        {displayOpen.length === 0 ? (
          <div className="bf-bsc-predict-empty">
            <p>No hay partidos abiertos para predecir ahora.</p>
            <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-ghost">
              Ver calendario
            </Link>
          </div>
        ) : regularMatches.length === 0 && !keyMatches.length && featuredEvent ? (
          <p className="bf-predict-active-only-featured">
            Solo el destacado de arriba está abierto. Vota antes de que cierre.
          </p>
        ) : (
          <div className="bf-predict-pickem-grid">
            {regularMatches.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      <PredictionsClosingSoon matches={closingSoon} />

      {displayOpen.length > 0 && (
        <PredictionsPopularRails buckets={popularBuckets} excludeId={featuredId} />
      )}

      {isLoggedIn && myPicks.length > 0 && <MyPredictionsMini picks={myPicks} />}

      <PredictionsHistorySection closed={closedEnriched} />
    </div>
  );
}
