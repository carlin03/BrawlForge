"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Target } from "lucide-react";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { FeaturedPredictionDuel } from "@/components/platform/predictions/FeaturedPredictionDuel";
import { MyPredictionRow } from "@/components/platform/predictions/MyPredictionRow";
import { PredictionsSidebar } from "@/components/platform/predictions/PredictionsSidebar";
import { PredictionsPlayerHero } from "@/components/platform/predictions/PredictionsPlayerHero";
import { PredictionsPopularRails } from "@/components/platform/predictions/PredictionsPopularRails";
import { PredictionsTopStrip } from "@/components/platform/predictions/PredictionsTopStrip";
import type { PredictionEvent } from "@/lib/data/predictions";
import { isKnownTeamSlug } from "@/lib/data";
import type { UserGameState } from "@/lib/supabase/game-types";
import type { PredictionLeaderboardRow } from "@/lib/supabase/game-types";
import {
  categorizePopularPicks,
  enrichPrediction,
  filterEnrichedList,
  pickFeaturedEvent,
  type PredictListFilter,
} from "@/lib/data/predictions-ui";
import { useAuth } from "@/contexts/AuthContext";

const FILTERS: { id: PredictListFilter; label: string }[] = [
  { id: "active", label: "Activos" },
  { id: "finished", label: "Finalizados" },
  { id: "hit", label: "Acertados" },
  { id: "miss", label: "Fallados" },
  { id: "all", label: "Todos" },
];

export function PredictionsView({
  open,
  closed,
  game,
  leaderboard,
  myRank,
  gapToNext,
  aboveRank,
}: {
  open: PredictionEvent[];
  closed: PredictionEvent[];
  game: UserGameState | null;
  leaderboard: PredictionLeaderboardRow[];
  myRank: number | null;
  gapToNext: number | null;
  aboveRank: number | null;
}) {
  const { isLoggedIn, profile, user } = useAuth();
  const [filter, setFilter] = useState<PredictListFilter>("active");

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
    () => displayClosed.map((e) => enrichPrediction(e, votes)),
    [displayClosed, votes],
  );

  const allEnriched = useMemo(() => [...openEnriched, ...closedEnriched], [openEnriched, closedEnriched]);

  const featuredEvent = useMemo(() => {
    const f = pickFeaturedEvent(displayOpen);
    return f ? enrichPrediction(f, votes) : null;
  }, [displayOpen, votes]);

  const featuredId = featuredEvent?.matchId;

  const filtered = useMemo(() => filterEnrichedList(allEnriched, filter), [allEnriched, filter]);

  const gridList = useMemo(
    () =>
      filtered.filter((e) => e.matchId !== featuredId || filter !== "active"),
    [filtered, featuredId, filter],
  );

  const myPicks = useMemo(
    () => allEnriched.filter((e) => e.userPick).slice(0, 12),
    [allEnriched],
  );

  const popularBuckets = useMemo(
    () => categorizePopularPicks(openEnriched),
    [openEnriched],
  );

  const activeCount = displayOpen.length;
  const finishedCount = displayClosed.length;

  return (
    <div className="bf-page-ultra bf-motion-page bf-predict-page bf-predict-bsc bf-predict-v2 bf-predict-v3">
      <header className="bf-predict-v2-head bf-predict-mode-head">
        <div>
          <p className="bf-bsc-predict-kicker">
            <Target size={14} aria-hidden /> Modo competitivo · BSC 2026
          </p>
          <h1 className="bf-predict-v2-title">
            Predicciones <em>ranked</em>
          </h1>
          <p className="bf-predict-mode-lead">
            Acierta partidos, gana puntos y escala en el ranking de la comunidad.
          </p>
        </div>
        <div className="bf-predict-v2-head-pills">
          <span className="bf-predict-v2-pill is-blue">
            <b>{activeCount}</b> activos
          </span>
          <span className="bf-predict-v2-pill is-red">
            <b>{finishedCount}</b> cerrados
          </span>
          {isLoggedIn && (
            <span className="bf-predict-v2-pill is-gold">
              <b>{game?.predictPoints ?? profile?.predictPoints ?? 0}</b> pts
            </span>
          )}
        </div>
        <div className="bf-predict-v2-head-actions">
          <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-ghost">
            <Calendar size={14} aria-hidden /> Partidos
          </Link>
          <Link href="/fantasy" className="bf-bsc-btn bf-bsc-btn-blue">
            Fantasy
          </Link>
        </div>
      </header>

      {featuredEvent && filter === "active" && <FeaturedPredictionDuel event={featuredEvent} />}

      <PredictionsPlayerHero
        game={game}
        myRank={myRank}
        gapToNext={gapToNext}
        aboveRank={aboveRank}
        closedEnriched={closedEnriched}
      />

      <div className="bf-predict-v2-filters" role="tablist" aria-label="Filtrar predicciones">
        {FILTERS.map((f) => {
          const count =
            f.id === "active"
              ? displayOpen.length
              : f.id === "finished"
                ? displayClosed.length
                : f.id === "hit"
                  ? allEnriched.filter((e) => e.outcome === "hit").length
                  : f.id === "miss"
                    ? allEnriched.filter((e) => e.outcome === "miss").length
                    : allEnriched.length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`bf-predict-v2-filter ${filter === f.id ? "is-on" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="bf-predict-v2-layout">
        <main className="bf-predict-v2-main">
          {isLoggedIn && myPicks.length > 0 && (
            <section className="bf-predict-my-section is-tier-2">
              <h2 className="bf-predict-v2-section-title">Mis predicciones</h2>
              <div className="bf-predict-my-scroll">
                {myPicks.map((e) => (
                  <MyPredictionRow key={`my-${e.id}`} event={e} />
                ))}
              </div>
            </section>
          )}

          {filter === "active" && (
            <PredictionsPopularRails buckets={popularBuckets} excludeId={featuredId} />
          )}

          <PredictionsTopStrip leaderboard={leaderboard} myRank={myRank} myUserId={user?.id} />

          <section className="bf-predict-v2-list is-tier-4">
            <h2 className="bf-predict-v2-section-title">
              {filter === "active" ? "Todos los partidos" : "Partidos"}
              <span className="bf-predict-v2-count">{gridList.length}</span>
            </h2>

            {gridList.length === 0 ? (
              <div className="bf-bsc-predict-empty">
                <p>No hay partidos en este filtro.</p>
                <Link href="/matches" className="bf-bsc-btn bf-bsc-btn-ghost">
                  Ver calendario
                </Link>
              </div>
            ) : (
              <div className="bf-bsc-predict-grid bf-predict-v2-grid bf-predict-v3-grid">
                {gridList.map((e) => (
                  <InteractiveVoteCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </section>
        </main>

        <PredictionsSidebar
          game={game}
          myRank={myRank}
          leaderboard={leaderboard}
          gapToNext={gapToNext}
          aboveRank={aboveRank}
          closedEnriched={closedEnriched}
        />
      </div>
    </div>
  );
}
