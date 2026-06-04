"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { FeaturedPredictionDuel } from "@/components/platform/predictions/FeaturedPredictionDuel";
import { PredictionsCompactHero } from "@/components/platform/predictions/PredictionsCompactHero";
import { MyPredictionsMini } from "@/components/platform/predictions/MyPredictionsMini";
import { PredictionsPopularRails } from "@/components/platform/predictions/PredictionsPopularRails";
import { PredictionsHistorySection } from "@/components/platform/predictions/PredictionsHistorySection";
import { PredictionsQuickVoteSection } from "@/components/platform/predictions/PredictionsQuickVoteSection";
import { PredictionsClosingSoon } from "@/components/platform/predictions/PredictionsClosingSoon";
import { PredictionsPickemToolbar } from "@/components/platform/predictions/PredictionsPickemToolbar";
import type { PlayoffBracketsStore } from "@/lib/data/bracket-config";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getMatch, isKnownTeamSlug, isPickemMatchEligible } from "@/lib/data";
import { isPickemMatchOpen } from "@/lib/data/match-effective-status";
import { expandTournamentSlugFilter } from "@/lib/data/matches";
import type { UserGameState } from "@/lib/supabase/game-types";
import {
  getAvailableRoundFilters,
  getPredictTournamentTabs,
  predictChronologySort,
  predictionMatchesSearch,
  eventMatchesRoundFilter,
  sortBracketsByDate,
  type PredictRoundFilterKey,
} from "@/lib/data/predictions-filters";
import {
  buildAllPlayoffBrackets,
  categorizePopularPicks,
  enrichPrediction,
  getAllPlayoffBracketMatchIds,
  getClosingSoonMatches,
  pickFeaturedEvent,
} from "@/lib/data/predictions-ui";
import { useAuth } from "@/contexts/AuthContext";

export function PredictionsView({
  open,
  closed,
  game,
  syncing = false,
  bracketStore = {},
}: {
  open: PredictionEvent[];
  closed: PredictionEvent[];
  game: UserGameState | null;
  syncing?: boolean;
  bracketStore?: PlayoffBracketsStore;
}) {
  const { isLoggedIn } = useAuth();
  const votes = game?.votes ?? {};
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<PredictRoundFilterKey>("all");
  const [search, setSearch] = useState("");

  const displayOpen = useMemo(
    () =>
      open.filter((e) => {
        const m = getMatch(e.matchId);
        if (m) return isPickemMatchEligible(m) && isPickemMatchOpen(m);
        return isPickemMatchEligible({
          id: e.matchId,
          teamASlug: e.teamASlug,
          teamBSlug: e.teamBSlug,
          stage: e.stage,
          scoreA: 0,
          scoreB: 0,
          tournamentSlug: e.tournamentSlug,
          date: e.deadline,
          status: "upcoming",
          region: "GLOBAL",
          format: "Bo3",
        });
      }),
    [open],
  );
  const displayClosed = useMemo(
    () => closed.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)),
    [closed],
  );

  const openEnriched = useMemo(
    () => displayOpen.map((e) => enrichPrediction(e, votes)).sort(predictChronologySort),
    [displayOpen, votes],
  );

  const closedEnriched = useMemo(
    () =>
      [...displayClosed]
        .map((e) => enrichPrediction(e, votes))
        .sort((a, b) => (b.matchDate ?? b.deadline).localeCompare(a.matchDate ?? a.deadline)),
    [displayClosed, votes],
  );

  const tournamentTabs = useMemo(() => getPredictTournamentTabs(openEnriched), [openEnriched]);

  const filteredOpen = useMemo(() => {
    let list = openEnriched;
    if (selectedTournament) {
      const slugs = new Set(expandTournamentSlugFilter(selectedTournament));
      list = list.filter((e) => slugs.has(e.tournamentSlug));
    }
    if (search.trim()) {
      list = list.filter((e) => predictionMatchesSearch(e, search));
    }
    if (selectedRound !== "all") {
      list = list.filter((e) => eventMatchesRoundFilter(e, selectedRound));
    }
    return [...list].sort(predictChronologySort);
  }, [openEnriched, selectedTournament, search, selectedRound]);

  const roundFilters = useMemo(
    () => getAvailableRoundFilters(openEnriched, selectedTournament),
    [openEnriched, selectedTournament],
  );

  useEffect(() => {
    if (!roundFilters.includes(selectedRound)) {
      setSelectedRound("all");
    }
  }, [roundFilters, selectedRound]);

  useEffect(() => {
    setSelectedRound("all");
  }, [selectedTournament]);

  const playoffBrackets = useMemo(() => {
    const all = sortBracketsByDate(buildAllPlayoffBrackets(openEnriched, bracketStore));
    if (!selectedTournament) return all;
    const slugs = new Set(expandTournamentSlugFilter(selectedTournament));
    return all.filter((b) => slugs.has(b.tournamentSlug));
  }, [openEnriched, bracketStore, selectedTournament]);

  const bracketMatchIds = useMemo(
    () => getAllPlayoffBracketMatchIds(playoffBrackets),
    [playoffBrackets],
  );

  const bracketEvents = useMemo(() => {
    if (!selectedTournament) return openEnriched;
    const slugs = new Set(expandTournamentSlugFilter(selectedTournament));
    return openEnriched.filter((e) => slugs.has(e.tournamentSlug));
  }, [openEnriched, selectedTournament]);

  const featuredEvent = useMemo(() => {
    const pool = filteredOpen.filter((e) => !bracketMatchIds.has(e.matchId));
    const scope = selectedTournament
      ? openEnriched.filter((e) => e.tournamentSlug === selectedTournament)
      : openEnriched;
    const f = pickFeaturedEvent(pool.length > 0 ? pool : scope);
    return f ? enrichPrediction(f, votes) : null;
  }, [filteredOpen, openEnriched, votes, bracketMatchIds, selectedTournament]);

  const featuredId = featuredEvent?.matchId;
  const showFeatured = Boolean(
    featuredEvent &&
      !bracketMatchIds.has(featuredEvent.matchId) &&
      !search.trim() &&
      (selectedRound === "all" || eventMatchesRoundFilter(featuredEvent, selectedRound)),
  );

  const regularMatches = useMemo(
    () =>
      filteredOpen
        .filter((e) => e.matchId !== featuredId && !bracketMatchIds.has(e.matchId))
        .sort(predictChronologySort),
    [filteredOpen, featuredId, bracketMatchIds],
  );

  const hasGroupMatches = useMemo(
    () => regularMatches.some((e) => (e.stageMeta?.roundKey ?? "other") === "group"),
    [regularMatches],
  );

  const closingSoon = useMemo(() => {
    const ids = new Set([featuredId, ...bracketMatchIds]);
    return getClosingSoonMatches(
      filteredOpen.filter((e) => !ids.has(e.matchId)),
      3,
    );
  }, [filteredOpen, featuredId, bracketMatchIds]);

  const myPicks = useMemo(
    () => filteredOpen.concat(closedEnriched).filter((e) => e.userPick),
    [filteredOpen, closedEnriched],
  );

  const popularBuckets = useMemo(() => categorizePopularPicks(filteredOpen), [filteredOpen]);

  const showGlobalExtras = !selectedTournament && !search.trim() && selectedRound === "all";

  return (
    <div className="bf-page-ultra bf-motion-page bf-predict-page bf-predict-bsc bf-predict-pickem">
      <PredictionsCompactHero
        activeCount={displayOpen.length}
        closedCount={displayClosed.length}
        game={game}
      />

      <PredictionsPickemToolbar
        tabs={tournamentTabs}
        selectedSlug={selectedTournament}
        onSelectTournament={setSelectedTournament}
        roundFilters={roundFilters}
        selectedRound={selectedRound}
        onSelectRound={setSelectedRound}
        search={search}
        onSearchChange={setSearch}
        resultCount={filteredOpen.length}
      />

      <PredictionsQuickVoteSection
        events={filteredOpen}
        votes={votes}
        brackets={playoffBrackets}
        hint="Cuartos en 2×2 — al elegir ganador, semifinales y final se actualizan solas."
      />

      {showFeatured && <FeaturedPredictionDuel event={featuredEvent!} />}

      {playoffBrackets.length === 0 && filteredOpen.length > 0 && !search.trim() && (
        <p className="bf-predict-round-hint">
          {selectedTournament
            ? "Este torneo no tiene cuartos/semis/final configurados en admin."
            : "No hay cuartos/semis/final con fase configurada. En admin → Partidos elige la ronda correcta."}
        </p>
      )}

      {syncing && <p className="bf-predict-sync-banner" aria-live="polite">Actualizando votos…</p>}

      {regularMatches.length > 0 && (
        <section className="bf-predict-active-main" aria-labelledby="predict-active-title">
          <h2 id="predict-active-title" className="bf-predict-pickem-section-title">
            {hasGroupMatches ? "Jornada y grupos" : "Partidos del calendario"}
            <span className="bf-predict-pickem-count">{regularMatches.length}</span>
          </h2>
          <p className="bf-predict-section-lead">
            Duelo 1 vs 1 con contexto competitivo — del más próximo al más lejano.
          </p>
          <div className="bf-predict-duel-stack">
            {regularMatches.map((e) => (
              <div key={e.id} className="bf-predict-bracket-grand-final is-group-duel">
                <InteractiveVoteCard event={e} featured={e.importance !== "normal"} />
              </div>
            ))}
          </div>
        </section>
      )}

      {filteredOpen.length === 0 && displayOpen.length > 0 && (
        <p className="bf-predict-round-hint">Ningún partido coincide con el filtro. Prueba otro equipo, torneo o ronda.</p>
      )}

      {displayOpen.length === 0 && (
        <div className="bf-bsc-predict-empty">
          <p>No hay partidos abiertos para predecir ahora.</p>
          <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-ghost">
            Ver calendario
          </Link>
          <Link href="/admin?module=competicion&tab=matches" className="bf-bsc-btn bf-bsc-btn-ghost">
            Crear partidos en admin
          </Link>
        </div>
      )}

      {showGlobalExtras && <PredictionsClosingSoon matches={closingSoon} />}

      {showGlobalExtras && filteredOpen.length > 0 && (
        <PredictionsPopularRails buckets={popularBuckets} excludeId={featuredId} />
      )}

      {isLoggedIn && myPicks.length > 0 && showGlobalExtras && <MyPredictionsMini picks={myPicks} />}

      <PredictionsHistorySection closed={closedEnriched} />
    </div>
  );
}
