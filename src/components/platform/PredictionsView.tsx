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
  buildAllPlayoffBrackets,
  categorizePopularPicks,
  enrichPrediction,
  getAllPlayoffBracketMatchIds,
  getClosingSoonMatches,
  pickFeaturedEvent,
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

  const playoffBrackets = useMemo(
    () => buildAllPlayoffBrackets(openEnriched),
    [openEnriched],
  );

  const bracketMatchIds = useMemo(
    () => getAllPlayoffBracketMatchIds(playoffBrackets),
    [playoffBrackets],
  );

  const featuredEvent = useMemo(() => {
    const pool = displayOpen.filter((e) => !bracketMatchIds.has(e.id));
    const f = pickFeaturedEvent(pool.length > 0 ? pool : displayOpen);
    return f ? enrichPrediction(f, votes) : null;
  }, [displayOpen, votes, bracketMatchIds]);

  const featuredId = featuredEvent?.matchId;
  const showFeatured = featuredEvent && !bracketMatchIds.has(featuredEvent.matchId);

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

      {playoffBrackets.length > 0 && (
        <nav className="bf-predict-tournament-jump" aria-label="Torneos con eliminatoria">
          {playoffBrackets.map((b) => (
            <a key={b.tournamentSlug} href={`#pickem-${b.tournamentSlug}`} className="bf-predict-tjump-pill">
              {b.tournamentName}
            </a>
          ))}
        </nav>
      )}

      {showFeatured && <FeaturedPredictionDuel event={featuredEvent} />}

      {playoffBrackets.length === 0 && displayOpen.length > 0 && (
        <p className="bf-predict-round-hint">
          No hay cuartos/semis/final con fase configurada. En admin → Partidos elige fase Cuartos, Semifinal o
          Gran final.
        </p>
      )}

      {playoffBrackets.map((bracket) => (
        <div key={bracket.tournamentSlug} id={`pickem-${bracket.tournamentSlug}`}>
          <PredictionsRoundSections
            bracket={bracket}
            votes={votes}
            events={openEnriched.concat(closedEnriched)}
          />
        </div>
      ))}

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
          <Link href="/admin?module=matches" className="bf-bsc-btn bf-bsc-btn-ghost">
            Crear partidos en admin
          </Link>
        </div>
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
