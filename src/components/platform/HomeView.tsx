"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FeaturedMatch } from "@/components/platform/ui";
import { MatchCountdown } from "@/components/platform/MatchCountdown";
import { ClubLogoRail } from "@/components/platform/ClubLogoRail";
import { PlayerCard, PlayerCardMini } from "@/components/platform/PlayerCard";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  CATALOG_STATS,
  catalogSyncedAt,
  DEFAULT_FANTASY_TOURNAMENT,
  FANTASY_BUDGET,
  getCuratedHomeMatches,
  getTeam,
  getCompetitiveTeamSlugs,
  getLiveMatches,
  getSquadValue,
  getTierBPlusTournaments,
  getTopFantasyPlayers,
  getUserSquad,
  getUpcomingMatches,
  getPlayerPrice,
  isKnownTeamSlug,
  matches,
  openPredictions,
  teamName,
  teams,
  tierBadgeClass,
  tierLabel,
  tournamentName,
} from "@/lib/data";

type MatchTab = "live" | "upcoming" | "results";

function formatSyncDate(iso: string | null): string {
  if (!iso) return "Liquipedia";
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "Liquipedia";
  }
}

function cleanTournamentName(name: string): string {
  return name.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function spotlightStage(stage: string): string {
  return stage.trim().toLowerCase() === "match" ? "Próximo duelo" : stage;
}

export function HomeView() {
  const [matchTab, setMatchTab] = useState<MatchTab>("upcoming");

  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const squadVal = getSquadValue(squad, DEFAULT_FANTASY_TOURNAMENT);
  const budgetLeft = FANTASY_BUDGET - squadVal;
  const budgetLabel = budgetLeft >= 0 ? `$${budgetLeft.toFixed(1)}M libre` : `$${Math.abs(budgetLeft).toFixed(1)}M sobre cap`;
  const capPct = Math.min(100, Math.round((squadVal / FANTASY_BUDGET) * 100));

  const competitiveSlugs = useMemo(() => new Set(getCompetitiveTeamSlugs()), []);
  const circuitTeams = useMemo(
    () =>
      teams
        .filter((t) => competitiveSlugs.has(t.slug) && isKnownTeamSlug(t.slug))
        .sort((a, b) => a.rank - b.rank),
    [competitiveSlugs],
  );

  const tierEvents = useMemo(() => getTierBPlusTournaments(12), []);
  const matchPool = getCuratedHomeMatches(matchTab, 6);
  const voteEvents = useMemo(() => {
    const seen = new Set<string>();
    return openPredictions
      .filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug))
      .filter((e) => {
        const key = e.matchId || e.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
  }, []);
  const showcasePros = useMemo(
    () => getTopFantasyPlayers(12).filter((p) => p.teamSlug && isKnownTeamSlug(p.teamSlug)).slice(0, 3),
    [],
  );

  const displayMatches = matches.filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug)).length;
  const spotlightMatch =
    live[0] ?? getUpcomingMatches().find((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug)) ?? null;
  const isLive = spotlightMatch?.status === "live";
  const spotlightTeamA = spotlightMatch ? getTeam(spotlightMatch.teamASlug) : null;
  const spotlightTeamB = spotlightMatch ? getTeam(spotlightMatch.teamBSlug) : null;
  const spotlightLabel = spotlightMatch
    ? `${teamName(spotlightMatch.teamASlug)} vs ${teamName(spotlightMatch.teamBSlug)}`
    : "Calendario sincronizando";

  return (
    <div className="bf-home bf-home-arena-page">
      <section className="bf-arena-hero bf-arena-hero--ultra">
        <div className="bf-arena-hero-bg" aria-hidden />
        <div className="bf-arena-hero-grid">
          <div className="bf-arena-hero-copy">
            <span className="bf-arena-kicker">Circuito BSC 2026 · {formatSyncDate(catalogSyncedAt)}</span>
            <h1 className="bf-arena-title">
              Brawl<span>Forge</span>
            </h1>
            <p className="bf-arena-lead">
              Fantasy con {CATALOG_STATS.playersActive} pros del catálogo Liquipedia. {CATALOG_STATS.teams} equipos.
              Torneos Tier B+ con logos PNG en cada club y competición.
            </p>

            <div className="bf-arena-command-strip" aria-label="Estado de la plataforma">
              <div className="bf-arena-command-card is-live">
                <span>Directo</span>
                <strong>{live.length || "0"}</strong>
                <em>{live.length === 1 ? "match activo" : "matches activos"}</em>
              </div>
              <div className="bf-arena-command-card">
                <span>Spotlight</span>
                <strong>{spotlightMatch ? spotlightStage(spotlightMatch.stage) : "BSC"}</strong>
                <em>{spotlightLabel}</em>
              </div>
              <div className="bf-arena-command-card is-gold">
                <span>Fantasy cap</span>
                <strong>{capPct}%</strong>
                <em>{budgetLabel}</em>
              </div>
            </div>

            <div className="bf-arena-stats">
              <div className="bf-arena-stat">
                <strong>{CATALOG_STATS.playersActive}</strong>
                <span>Jugadores</span>
              </div>
              <div className="bf-arena-stat">
                <strong>{CATALOG_STATS.teams}</strong>
                <span>Equipos</span>
              </div>
              <div className="bf-arena-stat">
                <strong>{displayMatches}</strong>
                <span>Partidos</span>
              </div>
              <div className="bf-arena-stat">
                <strong>{CATALOG_STATS.tournaments2026}</strong>
                <span>Torneos 2026</span>
              </div>
            </div>

            <div className="bf-arena-ctas">
              <Link href="/fantasy" className="bf-arena-cta bf-arena-cta-gold">Mi Arena</Link>
              <Link href="/predictions" className="bf-arena-cta bf-arena-cta-red">
                Votar ({openPredictions.length})
              </Link>
              <Link href="/players" className="bf-arena-cta bf-arena-cta-blue">
                {CATALOG_STATS.playersActive} Pros
              </Link>
            </div>
          </div>

          <div className="bf-arena-cards-stage">
            <div className="bf-arena-cards-glow" aria-hidden />
            <div className="bf-arena-stage-badge" aria-hidden>
              Cartas top fantasy
            </div>
            <div className="bf-arena-cards">
              {showcasePros.map((p, i) => (
                <div key={p.slug} className={`bf-arena-card-slot pos-${i}`}>
                  <PlayerCard
                    playerSlug={p.slug}
                    size={i === 1 ? "hero" : "xl"}
                    price={getPlayerPrice(p.slug)}
                    href={`/players/${p.slug}`}
                    featured={i === 0 ? "MVP" : i === 2 ? "HOT" : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <ClubLogoRail teams={circuitTeams} />
      </section>

      <section className="bf-arena-squad bf-arena-squad--premium">
        <div className="bf-arena-squad-head">
          <div>
            <span className="bf-home-eyebrow">Tu plantilla</span>
            <h2 className="bf-home-block-title">Fantasy · Brawl Cup</h2>
          </div>
          <div className="bf-arena-squad-meta">
            <span className={budgetLeft < 0 ? "is-over-cap" : ""}>{budgetLabel}</span>
            <span>{capPct}% usado</span>
            <Link href="/fantasy" className="bp-btn bp-btn-gold">Montar plantilla</Link>
          </div>
        </div>
        <div className="bf-arena-squad-row">
          {squad.map((s) => (
            <PlayerCardMini key={s.playerSlug} playerSlug={s.playerSlug} isCaptain={s.isCaptain} />
          ))}
          {Array.from({ length: Math.max(0, 3 - squad.length) }).map((_, i) => (
            <Link key={i} href="/fantasy" className="bf-card-mini bf-card-add">
              <span className="bf-card-mini-avatar">+</span>
              <span className="bf-card-mini-name">Fichar</span>
            </Link>
          ))}
        </div>
      </section>

      {spotlightMatch && (
        <section className={`bf-home-hero bf-premium-spotlight ${isLive ? "is-live" : ""}`}>
          <Link href={`/matches/${spotlightMatch.id}`} className="bf-home-hero-link">
            <div className="bf-home-hero-glow" aria-hidden />
            <div className="bf-home-hero-top">
              <TournamentLogo slug={spotlightMatch.tournamentSlug} name={tournamentName(spotlightMatch.tournamentSlug)} size={40} />
              <div className="bf-home-hero-meta">
                <span className="bf-home-eyebrow">{isLive ? "En directo" : "Spotlight"}</span>
                <strong>{tournamentName(spotlightMatch.tournamentSlug)}</strong>
              </div>
              {isLive ? (
                <span className="bp-chip bp-chip-live"><span className="bp-live-dot" /> LIVE</span>
              ) : (
                <MatchCountdown dateStr={spotlightMatch.date} className="bf-home-hero-countdown" />
              )}
            </div>
            <div className="bf-home-hero-battle">
              <div className="bf-home-hero-side">
                <TeamLogo slug={spotlightMatch.teamASlug} name={teamName(spotlightMatch.teamASlug)} size="2xl" />
                <strong>{teamName(spotlightMatch.teamASlug)}</strong>
                {spotlightTeamA && <span>{spotlightTeamA.region} · {spotlightTeamA.tag}</span>}
              </div>
              <span className="bf-home-hero-vs">VS</span>
              <div className="bf-home-hero-side">
                <TeamLogo slug={spotlightMatch.teamBSlug} name={teamName(spotlightMatch.teamBSlug)} size="2xl" />
                <strong>{teamName(spotlightMatch.teamBSlug)}</strong>
                {spotlightTeamB && <span>{spotlightTeamB.region} · {spotlightTeamB.tag}</span>}
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="bf-home-hub bf-premium-section">
        <div className="bf-home-block-head">
          <h2 className="bf-home-block-title">Calendario</h2>
          <Link href="/matches" className="bf-home-link">Ver todo</Link>
        </div>
        <div className="bf-home-tabs">
          {(["live", "upcoming", "results"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`bf-home-tab ${matchTab === tab ? "is-on" : ""}`}
              onClick={() => setMatchTab(tab)}
            >
              {tab === "live" ? `Directo (${live.length})` : tab === "upcoming" ? "Próximos" : "Resultados"}
            </button>
          ))}
        </div>
        <div className="bf-home-match-list">
          {matchPool.length > 0 ? (
            matchPool.map((m) => (
              <FeaturedMatch key={m.id} match={m} tag={m.status === "live" ? "LIVE" : undefined} />
            ))
          ) : (
            <div className="bf-home-empty">
              No hay partidos en esta pestaña ahora mismo. Cambia de filtro o vuelve cuando Liquipedia actualice el calendario.
            </div>
          )}
        </div>
      </section>

      <section className="bf-home-tours bf-premium-section">
        <div className="bf-home-block-head">
          <h2 className="bf-home-block-title">Torneos Tier B+</h2>
          <Link href="/tournaments" className="bf-home-link">Explorar</Link>
        </div>
        <div className="bf-home-tours-track">
          {tierEvents.map((t) => (
            <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-home-tour-card">
              <TournamentLogo slug={t.slug} name={cleanTournamentName(t.shortName)} size={48} />
              <div className="bf-home-tour-body">
                {t.tier != null && <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>}
                <strong>{cleanTournamentName(t.shortName)}</strong>
                <span>{t.prizePool}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {voteEvents.length > 0 && (
        <section className="bf-home-predict bf-premium-section">
          <div className="bf-home-block-head">
            <h2 className="bf-home-block-title">Pronostica ahora</h2>
            <Link href="/predictions" className="bf-home-link">Todas</Link>
          </div>
          <div className="bf-predict-grid">
            {voteEvents.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <section className="bf-home-circuit bf-premium-section">
        <div className="bf-home-block-head">
          <h2 className="bf-home-block-title">Clubes del circuito</h2>
          <Link href="/teams" className="bf-home-link">Ver todos</Link>
        </div>
        <div className="bf-home-club-grid">
          {circuitTeams.slice(0, 24).map((t) => (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="bf-home-club-tile">
              <TeamLogo slug={t.slug} name={t.name} size={52} />
              <span className="bf-home-club-tag">{t.tag}</span>
              <span className="bf-home-club-region">{t.region}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
