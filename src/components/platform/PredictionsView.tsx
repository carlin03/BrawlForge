"use client";

import { useMemo } from "react";
import Link from "next/link";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { FeaturedPredictionDuel } from "@/components/platform/predictions/FeaturedPredictionDuel";
import { PredictionsCompactHero } from "@/components/platform/predictions/PredictionsCompactHero";
import { MyPredictionsMini } from "@/components/platform/predictions/MyPredictionsMini";
import { PredictionsPopularRails } from "@/components/platform/predictions/PredictionsPopularRails";
import { PredictionsHistorySection } from "@/components/platform/predictions/PredictionsHistorySection";
import { PredictionsRoundSections } from "@/components/platform/predictions/PredictionsRoundSections";
import { PredictionsClosingSoon } from "@/components/platform/predictions/PredictionsClosingSoon";
import type { PredictionEvent } from "@/lib/data/predictions";
import { isKnownTeamSlug } from "@/lib/data";
import type { UserGameState } from "@/lib/supabase/game-types";
import {
  buildPlayoffBracket,
  categorizePopularPicks,
  enrichPrediction,
  getClosingSoonMatches,
  getPlayoffBracketMatchIds,
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

  const playoffBracket = useMemo(() => {
    const slug =
      featuredEvent?.tournamentSlug ??
      pickPlayoffTournamentSlug(openEnriched.concat(closedEnriched));
    if (!slug) return null;
    return buildPlayoffBracket(slug, openEnriched.concat(closedEnriched));
  }, [featuredEvent, openEnriched, closedEnriched]);

  const bracketMatchIds = useMemo(
    () => getPlayoffBracketMatchIds(playoffBracket),
    [playoffBracket],
  );

  const activeList = useMemo(
    () =>
      openEnriched
        .filter((e) => e.matchId !== featuredId && !bracketMatchIds.has(e.matchId))
        .sort(stageImportanceSort),
    [openEnriched, featuredId, bracketMatchIds],
  );

  const regularMatches = useMemo(() => activeList, [activeList]);

  const hasGroupMatches = useMemo(
    () => regularMatches.some((e) => (e.stageMeta?.roundKey ?? "other") === "group"),
    [regularMatches],
  );

  const closingSoon = useMemo(() => {
    const ids = new Set([featuredId, ...bracketMatchIds]);
    return getClosingSoonMatches(
      openEnriched.filter((e) => !ids.has(e.matchId)),
      3,
    );
  }, [openEnriched, featuredId, bracketMatchIds]);

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

      {playoffBracket && (
        <PredictionsRoundSections
          bracket={playoffBracket}
          votes={votes}
          events={openEnriched.concat(closedEnriched)}
        />
      )}

      {syncing && <p className="bf-predict-sync-banner" aria-live="polite">Actualizando votos…</p>}

      {regularMatches.length > 0 && (
        <section className="bf-predict-active-main" aria-labelledby="predict-active-title">
          <h2 id="predict-active-title" className="bf-predict-pickem-section-title">
            {hasGroupMatches ? "Jornada y grupos" : "Partidos del calendario"}
            <span className="bf-predict-pickem-count">{regularMatches.length}</span>
          </h2>
          <p className="bf-predict-section-lead">
            {hasGroupMatches
              ? "Fase de grupos y partidos semanales — misma card estándar."
              : "Resto de enfrentamientos abiertos para predecir."}
          </p>
          <div className="bf-predict-pickem-grid">
            {regularMatches.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {displayOpen.length === 0 && (
        <div className="bf-bsc-predict-empty">
          <p>No hay partidos abiertos para predecir ahora.</p>
          <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-ghost">
            Ver calendario
          </Link>
        </div>
      )}

      {displayOpen.length > 0 &&
        regularMatches.length === 0 &&
        !playoffBracket &&
        featuredEvent && (
          <p className="bf-predict-active-only-featured">
            Solo el destacado de arriba está abierto. Vota antes de que cierre.
          </p>
        )}

      <PredictionsClosingSoon matches={closingSoon} />

      {displayOpen.length > 0 && (
        <PredictionsPopularRails buckets={popularBuckets} excludeId={featuredId} />
      )}

      {isLoggedIn && myPicks.length > 0 && <MyPredictionsMini picks={myPicks} />}

      <PredictionsHistorySection closed={closedEnriched} />
    </div>
  );
}
