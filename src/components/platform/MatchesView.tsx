"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Radio, Target, Trophy } from "lucide-react";
import type { Region } from "@/lib/types";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { MatchesControls } from "@/components/platform/MatchesControls";
import { MatchSpotlightCard } from "@/components/platform/MatchSpotlightCard";
import { MatchHubRow } from "@/components/platform/MatchHubRow";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  countHubMatches,
  filterHubMatches,
  groupMatchesByTournament,
  tournamentsInMatches,
  type MatchTab,
} from "@/lib/data/matches-hub";
import {
  matches,
  isKnownTeamSlug,
  getRecentMatches,
  getTierBPlusTournaments,
  tierBadgeClass,
  tierLabel,
  teamName,
} from "@/lib/data";
import { getMatchEnrichment } from "@/lib/data/match-meta";

function cleanName(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function MatchesView() {
  const { aggregates, game } = useGame();
  const displayable = useMemo(() => matches.filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug)), []);
  const counts = useMemo(() => countHubMatches(displayable), [displayable]);

  const [tab, setTab] = useState<MatchTab>(counts.live > 0 ? "live" : "upcoming");
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
  const groups = useMemo(() => groupMatchesByTournament(listRest), [listRest]);

  const tierTours = useMemo(() => getTierBPlusTournaments(12), []);

  const hotVote = useMemo(() => {
    const { open } = buildPredictionEvents(aggregates, game?.votes ?? {});
    return open.find((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug));
  }, [aggregates, game?.votes]);

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
        ? "Sin partidos programados con estos filtros."
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
            Directo, calendario y resultados del circuito. Filtra por región, torneo o club.
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

          {hotVote && tab !== "results" && (
            <section className="bf-matches-hub-vote bf-predict-bsc">
              <div className="bf-matches-hub-vote-head">
                <h2>Predicción rápida</h2>
                <Link href="/predictions">Ver todas</Link>
              </div>
              <InteractiveVoteCard event={hotVote} featured />
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
                    {g.matches.map((m) => (
                      <MatchHubRow key={m.id} match={m} />
                    ))}
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
                    <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size={28} glow={false} />
                    <span className="bf-matches-hub-upset-score">
                      {m.scoreA} – {m.scoreB}
                    </span>
                    <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size={28} glow={false} />
                    <span className="bp-chip bp-chip-gold">Upset</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="bf-matches-hub-aside">
          <div className="bf-matches-hub-aside-panel">
            <div className="bf-matches-hub-aside-head">
              <h2>Torneos 2026</h2>
              <Link href="/tournaments">Todos</Link>
            </div>
            <ul className="bf-matches-hub-tour-list">
              {tierTours.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tournaments/${t.slug}`} className="bf-matches-hub-tour-item">
                    <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={36} glow={false} />
                    <div>
                      <strong>{cleanName(t.shortName)}</strong>
                      <span>{t.prizePool}</span>
                    </div>
                    {t.tier != null && (
                      <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageUltraShell>
  );
}
