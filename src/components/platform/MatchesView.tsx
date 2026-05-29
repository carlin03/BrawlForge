"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Radio, Target } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";
import { MatchLine, FeaturedMatch } from "@/components/platform/ui";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import {
  getLiveMatches,
  getRecentMatches,
  getCuratedHomeMatches,
  isKnownTeamSlug,
  teamName,
  getTierBPlusTournaments,
} from "@/lib/data";
import { getMatchEnrichment } from "@/lib/data/match-meta";

function cleanName(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function MatchesView() {
  const { aggregates, game } = useGame();
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "upcoming");
  const tierTours = useMemo(
    () => getTierBPlusTournaments(10).filter((t) => t.startDate?.startsWith("2026")),
    [],
  );

  const hotVote = useMemo(() => {
    const { open } = buildPredictionEvents(aggregates, game?.votes ?? {});
    return open.find((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug));
  }, [aggregates, game?.votes]);

  const list = useMemo(() => getCuratedHomeMatches(tab, 12), [tab]);
  const spotlight = list[0] ?? null;
  const listRest = spotlight ? list.slice(1) : list;

  const upsets = useMemo(
    () =>
      getRecentMatches(30)
        .filter((m) => isKnownTeamSlug(m.teamASlug) && m.status === "finished")
        .filter((m) => {
          const enrich = getMatchEnrichment(m);
          const winnerIsA = m.scoreA > m.scoreB;
          const communityFavA = enrich.communityPickA >= 50;
          return winnerIsA !== communityFavA;
        })
        .slice(0, 4),
    [],
  );

  return (
    <PageUltraShell className="bf-matches-page bf-matches-ultra bf-arena-page bf-arena-static">
      <PageUltraHero
        kicker={
          <>
            <span className="bp-live-dot" /> Calendario BSC
          </>
        }
        title={
          <>
            Centro de <em>partidos</em>
          </>
        }
        lead="Directo, próximos y resultados del circuito pro 2026. Solo clubes con actividad en la temporada."
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="fu-stat">
              <b>{live.length || "—"}</b>
              <span>En directo</span>
            </div>
            <div className="fu-stat">
              <b>{list.length}</b>
              <span>En esta vista</span>
            </div>
            <div className="fu-stat">
              <b>{tierTours.length}</b>
              <span>Torneos activos</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href="/predictions" className="fu-btn fu-btn-red">
              <Target size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Predicciones
            </Link>
            <Link href="/fantasy" className="fu-btn fu-btn-gold">
              Fantasy
            </Link>
          </>
        }
        showcase={
          spotlight ? (
            <div className="bf-arena-duel-static" aria-hidden={false}>
              <div className="bf-arena-duel-side">
                <TeamLogo slug={spotlight.teamASlug} name={teamName(spotlight.teamASlug)} size={88} glow />
                <span>{teamName(spotlight.teamASlug)}</span>
              </div>
              <span className="fu-duel-vs">VS</span>
              <div className="bf-arena-duel-side">
                <TeamLogo slug={spotlight.teamBSlug} name={teamName(spotlight.teamBSlug)} size={88} glow />
                <span>{teamName(spotlight.teamBSlug)}</span>
              </div>
            </div>
          ) : (
            <div className="bf-arena-duel-static bf-arena-duel-empty">
              <Calendar size={48} color="var(--bp-gold)" />
              <span>Calendario 2026</span>
            </div>
          )
        }
      />

      <div className="fu-tabs bf-arena-tabs">
        {(["live", "upcoming", "results"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`fu-tab ${tab === t ? "is-on" : ""} ${t === "live" && live.length ? "has-live" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "live" ? `Directo (${live.length})` : t === "upcoming" ? "Próximos" : "Resultados"}
          </button>
        ))}
      </div>

      <div className="bf-matches-layout">
        <div className="bf-matches-main">
          {spotlight && (
            <section className="bf-matches-spotlight-block">
              <h2 className="bf-arena-section-title">
                {spotlight.status === "live" ? "En directo" : "Partido destacado"}
              </h2>
              <FeaturedMatch match={spotlight} tag={spotlight.status === "live" ? "EN DIRECTO" : "Destacado"} />
            </section>
          )}

          {hotVote && tab !== "results" && (
            <section className="bf-matches-vote-block bf-predict-bsc">
              <div className="fu-panel-head" style={{ marginBottom: 12 }}>
                <h2>
                  <Radio size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                  Predicción · azul vs rojo
                </h2>
                <Link href="/predictions">Todas</Link>
              </div>
              <InteractiveVoteCard event={hotVote} featured />
            </section>
          )}

          <section className="bf-matches-feed">
            <h2 className="bf-arena-section-title">
              {tab === "live" ? "Todos en directo" : tab === "upcoming" ? "Próximos partidos" : "Resultados"}
            </h2>
            {listRest.length > 0 ? (
              listRest.map((m) => <MatchLine key={m.id} match={m} rich />)
            ) : !spotlight ? (
              <p className="bf-home-empty">Sin partidos en esta pestaña.</p>
            ) : null}

            {upsets.length > 0 && tab === "results" && (
              <div className="bf-matches-upsets">
                <span className="fu-kicker">Upsets</span>
                {upsets.map((m) => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="bf-matches-upset-row bf-shine-hover">
                    <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size={32} />
                    <span className="bf-matches-score">
                      {m.scoreA} – {m.scoreB}
                    </span>
                    <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size={32} />
                    <span className="bp-chip bp-chip-gold">Upset</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="bf-fantasy-aside">
          <div className="fu-panel">
            <div className="fu-panel-head">
              <h2>Torneos BSC 2026</h2>
              <Link href="/tournaments">Todos</Link>
            </div>
            {tierTours.slice(0, 8).map((t) => (
              <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-matches-tour-row">
                <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={36} />
                <div>
                  <strong>{cleanName(t.shortName)}</strong>
                  <span>{t.prizePool}</span>
                </div>
                {t.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                )}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </PageUltraShell>
  );
}
