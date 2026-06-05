"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Radio, Target, Trophy } from "lucide-react";
import type { Region } from "@/lib/types";
import { MatchesControls } from "@/components/platform/MatchesControls";
import { MatchSpotlightCard } from "@/components/platform/MatchSpotlightCard";
import { MatchHubRow } from "@/components/platform/MatchHubRow";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { MatchesTournamentsPanel } from "@/components/platform/MatchesTournamentsPanel";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  countHubMatches,
  filterHubMatches,
  groupMatchesByTournament,
  playoffSectionsForMatches,
  tournamentsInMatches,
  defaultMatchHubTab,
  type MatchTab,
} from "@/lib/data/matches-hub";
import {
  isKnownTeamSlug,
  getRecentMatches,
  buildPublicCalendarPool,
  resolveMatchTeamName,
  getTierBPlusTournaments,
} from "@/lib/data";
import { getMatchEnrichment } from "@/lib/data/match-meta";
import { getMatchPool } from "@/lib/data/match-pool";
import { useOptionalCmsRuntime } from "@/contexts/CmsRuntimeContext";

export function MatchesView() {
  const cms = useOptionalCmsRuntime();
  const displayable = useMemo(() => {
    const pool = cms?.matchPool ?? getMatchPool();
    return buildPublicCalendarPool(pool);
  }, [cms?.matchPool]);
  const counts = useMemo(() => countHubMatches(displayable), [displayable]);

  const [tab, setTab] = useState<MatchTab>(() => defaultMatchHubTab(counts));
  const [region, setRegion] = useState<Region | "all">("all");
  const [tournamentSlug, setTournamentSlug] = useState("all");
  const [query, setQuery] = useState("");

  const tabPool = useMemo(
    () => filterHubMatches(displayable, { tab, region, tournamentSlug: "all", query: "" }),
    [displayable, tab, region],
  );

  const tournamentOptions = useMemo(() => tournamentsInMatches(tabPool), [tabPool]);

  const filtered = useMemo(
    () => filterHubMatches(displayable, { tab, region, tournamentSlug, query }),
    [displayable, tab, region, tournamentSlug, query],
  );

  const spotlight = filtered[0] ?? null;
  const listRest = spotlight ? filtered.slice(1) : filtered;
  const groups = useMemo(() => groupMatchesByTournament(listRest, tab), [listRest, tab]);

  const [tourQuery, setTourQuery] = useState("");
  const tierTours = useMemo(() => getTierBPlusTournaments(48), []);

  const upsets = useMemo(
    () =>
      getRecentMatches(40)
        .filter((m) => isKnownTeamSlug(m.teamASlug) && m.status === "finished")
        .filter((m) => {
          const enrich = getMatchEnrichment(m);
          const winnerIsA = m.scoreA > m.scoreB;
          const communityFavA = enrich.communityPickA >= 50;
          return winnerIsA !== communityFavA;
        })
        .slice(0, 5),
    [],
  );

  const emptyCopy =
    tab === "live"
      ? "No hay partidos en directo ahora. Revisa Próximos o Resultados."
      : tab === "upcoming"
        ? "Sin partidos próximos con estos filtros. Revisa Resultados o quita el filtro de torneo."
        : "Sin resultados con estos filtros.";

  return (
    <PageUltraShell className="bf-matches-page bf-matches-hub">
      <header className="bf-matches-hero">
        <div className="bf-matches-hero-text">
          <p className="bf-matches-hero-kicker">
            <CalendarDays size={14} aria-hidden /> BSC 2026 · Calendario
          </p>
          <h1>
            Partidos <em>pro</em>
          </h1>
          <p className="bf-matches-hero-lead">
            Calendario y resultados reales (Liquipedia). Las predicciones están en su sección aparte.
          </p>
        </div>

        <div className="bf-matches-hero-stats">
          <div className={`bf-matches-stat ${counts.live > 0 ? "has-live" : ""}`}>
            <b>{counts.live}</b>
            <span>En directo</span>
          </div>
          <div className="bf-matches-stat">
            <b>{counts.upcoming}</b>
            <span>Próximos</span>
          </div>
          <div className="bf-matches-stat">
            <b>{counts.results}</b>
            <span>Resultados</span>
          </div>
        </div>

        <div className="bf-matches-hero-actions">
          <Link href="/predictions" className="fu-btn fu-btn-red">
            <Target size={14} aria-hidden />
            Predicciones
          </Link>
          <Link href="/fantasy" className="fu-btn fu-btn-gold">
            Fantasy
          </Link>
        </div>
      </header>

      <MatchesControls
        tab={tab}
        onTabChange={setTab}
        counts={counts}
        region={region}
        onRegionChange={setRegion}
        tournamentSlug={tournamentSlug}
        onTournamentChange={setTournamentSlug}
        tournaments={tournamentOptions}
        query={query}
        onQueryChange={setQuery}
      />

      <div className="bf-matches-hub-layout">
        <div className="bf-matches-hub-main">
          {spotlight && (
            <section className="bf-matches-hub-spotlight" aria-labelledby="matches-spotlight-title">
              <h2 id="matches-spotlight-title" className="bf-matches-hub-section-title">
                {spotlight.status === "live" ? (
                  <>
                    <Radio size={16} aria-hidden /> En directo ahora
                  </>
                ) : tab === "upcoming" ? (
                  "Siguiente en el calendario"
                ) : (
                  "Último destacado"
                )}
              </h2>
              <MatchSpotlightCard match={spotlight} />
            </section>
          )}

          <section className="bf-matches-hub-list" aria-labelledby="matches-list-title">
            <div className="bf-matches-hub-list-head">
              <h2 id="matches-list-title">
                {tab === "live" ? "Todos en directo" : tab === "upcoming" ? "Calendario" : "Historial"}
              </h2>
              <span className="bf-matches-hub-count">{filtered.length} partidos</span>
            </div>

            {filtered.length === 0 ? (
              <div className="bf-matches-hub-empty">
                <CalendarDays size={40} aria-hidden />
                <p>{emptyCopy}</p>
                {(query || tournamentSlug !== "all" || region !== "all") && (
                  <button
                    type="button"
                    className="fu-btn fu-btn-ghost"
                    onClick={() => {
                      setQuery("");
                      setTournamentSlug("all");
                      setRegion("all");
                    }}
                  >
                    Quitar filtros
                  </button>
                )}
              </div>
            ) : groups.length > 0 ? (
              groups.map((g) => (
                <div key={g.tournamentSlug} className="bf-matches-hub-group">
                  <Link href={`/tournaments/${g.tournamentSlug}`} className="bf-matches-hub-group-head">
                    <TournamentLogo slug={g.tournamentSlug} name={g.label} size={32} glow={false} />
                    <div>
                      <strong>{g.label}</strong>
                      <span>
                        {g.matches.length} partido{g.matches.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Trophy size={16} className="bf-matches-hub-group-icon" aria-hidden />
                  </Link>
                  <div className="bf-matches-hub-rows">
                    {(() => {
                      const sections = playoffSectionsForMatches(g.matches, tab);
                      const useSections = sections.some((s) =>
                        ["quarter", "semi", "final"].includes(String(s.roundKey)),
                      );
                      if (!useSections) {
                        return g.matches.map((m) => <MatchHubRow key={m.id} match={m} />);
                      }
                      return sections.map((section) => (
                        <div
                          key={`${g.tournamentSlug}-${section.roundKey}`}
                          className={`bf-matches-hub-round ${section.roundKey === "quarter" ? "is-quarters" : ""} ${section.roundKey === "semi" ? "is-semis" : ""} ${section.roundKey === "final" ? "is-final" : ""}`}
                        >
                          <h3 className="bf-matches-hub-round-title">{section.label}</h3>
                          <div className="bf-matches-hub-round-rows">
                            {section.matches.map((m) => (
                              <MatchHubRow key={m.id} match={m} />
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <div className="bf-matches-hub-rows">
                {listRest.map((m) => (
                  <MatchHubRow key={m.id} match={m} />
                ))}
              </div>
            )}
          </section>

          {upsets.length > 0 && tab === "results" && !query && tournamentSlug === "all" && (
            <section className="bf-matches-hub-upsets">
              <h2 className="bf-matches-hub-section-title">Upsets recientes</h2>
              <p className="bf-matches-hub-upsets-lead">La comunidad no acertó el favorito.</p>
              <div className="bf-matches-hub-upsets-grid">
                {upsets.map((m) => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="bf-matches-hub-upset-card">
                    <TeamLogo slug={m.teamASlug} name={resolveMatchTeamName(m, "A")} size={28} glow={false} />
                    <span className="bf-matches-hub-upset-score">
                      {m.scoreA} – {m.scoreB}
                    </span>
                    <TeamLogo slug={m.teamBSlug} name={resolveMatchTeamName(m, "B")} size={28} glow={false} />
                    <span className="bp-chip bp-chip-gold">Upset</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="bf-matches-hub-aside">
          <MatchesTournamentsPanel
            tournaments={tierTours}
            selectedSlug={tournamentSlug}
            onSelect={setTournamentSlug}
            query={tourQuery}
            onQueryChange={setTourQuery}
          />
        </aside>
      </div>
    </PageUltraShell>
  );
}
