"use client";

import Link from "next/link";
import { MatchLine } from "@/components/platform/ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { tierBadgeClass, tierLabel, isTierBPlus } from "@/lib/data";
import {
  getTournament,
  teamName,
  hasFantasyForTournament,
  getTournamentParticipantSlugs,
  isKnownTeamSlug,
  getMatchesByTournament,
} from "@/lib/data";
import { formatTournamentDates, getTournamentStats } from "@/lib/data/tournament-stats";
import { getFantasyPlayersForTournament, getFantasyTeamsForTournament } from "@/lib/data/fantasy-rosters";
import { getPlayer, getPlayerPrice } from "@/lib/data";
import { PlayerCard } from "@/components/platform/PlayerCard";

function clean(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function TournamentDetailView({ slug }: { slug: string }) {
  const tournament = getTournament(slug);
  if (!tournament) {
    return (
      <div className="bf-home-empty" style={{ padding: 32 }}>
        <p>Torneo no encontrado.</p>
        <Link href="/tournaments">Ver torneos</Link>
      </div>
    );
  }

  const stats = getTournamentStats(slug);
  const matches = getMatchesByTournament(slug);
  const participants = getTournamentParticipantSlugs(slug).filter(isKnownTeamSlug);
  const fantasyEnabled = hasFantasyForTournament(slug);
  const fantasyTeams = getFantasyTeamsForTournament(slug);
  const fantasyPool = getFantasyPlayersForTournament(slug).slice(0, 8);
  const dateLabel = formatTournamentDates(tournament.startDate, tournament.endDate);

  const liveMatches = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const finished = matches.filter((m) => m.status === "finished").slice(0, 10);

  return (
    <div className="bf-tour-page">
      <section
        className={`bf-tour-hero ${tournament.status === "live" ? "is-live" : tournament.status === "upcoming" ? "is-upcoming" : "is-finished"}`}
      >
        <div className="bf-tour-hero-bg" aria-hidden />
        <TournamentLogo slug={slug} name={clean(tournament.shortName)} size={96} />
        <div className="bf-tour-hero-body">
          <div className="bf-tour-hero-badges">
            {tournament.tier != null && (
              <span className={`bf-tier-badge ${tierBadgeClass(tournament.tier)}`}>{tierLabel(tournament.tier)}</span>
            )}
            {isTierBPlus(tournament) && <span className="bp-chip bp-chip-gold">Circuito B+</span>}
            <span className="bp-chip">{tournament.region}</span>
            <span className={`bf-home-tour-status status-${tournament.status}`}>
              {tournament.status === "live" ? "En directo" : tournament.status === "upcoming" ? "Próximo" : "Finalizado"}
            </span>
          </div>
          <h1 className="bf-tour-hero-title">{clean(tournament.name)}</h1>
          <p className="bf-tour-hero-meta">
            {tournament.prizePool} · {dateLabel} · {tournament.location}
            {tournament.stage && ` · ${tournament.stage}`}
          </p>
          <div className="bf-tour-hero-actions">
            {fantasyEnabled && (
              <Link href={`/fantasy?tournament=${slug}`} className="bp-btn bp-btn-gold">
                Fantasy del torneo
              </Link>
            )}
            <Link href="/predictions" className="bp-btn bp-btn-red">Votar</Link>
            <a href={tournament.liquipediaUrl} target="_blank" rel="noopener noreferrer" className="bp-btn bp-btn-ghost">
              Liquipedia
            </a>
          </div>
        </div>
      </section>

      {tournament.winnerSlug && (
        <div className="bf-tour-champion">
          <span className="bf-home-eyebrow">Campeón</span>
          <TeamLogo slug={tournament.winnerSlug} name={teamName(tournament.winnerSlug)} size={56} />
          <Link href={`/teams/${tournament.winnerSlug}`} className="bf-tour-champion-name">
            {teamName(tournament.winnerSlug)}
          </Link>
        </div>
      )}

      <div className="bf-tour-stats-bar">
        <div className="bf-tour-stat"><strong>{stats.participantCount || participants.length}</strong><span>Equipos</span></div>
        <div className="bf-tour-stat"><strong>{tournament.prizePool}</strong><span>Premio</span></div>
        <div className="bf-tour-stat"><strong>{stats.totalMatches}</strong><span>Partidos</span></div>
        <div className="bf-tour-stat"><strong>{stats.liveMatches || stats.upcomingMatches}</strong><span>{stats.liveMatches ? "En vivo" : "Próximos"}</span></div>
        <div className="bf-tour-stat"><strong>{stats.finishedMatches}</strong><span>Jugados</span></div>
        <div className="bf-tour-stat"><strong>{stats.formats.join(", ") || "—"}</strong><span>Formato</span></div>
      </div>

      {liveMatches.length > 0 && (
        <section className="bf-tour-section">
          <h2 className="bf-home-block-title"><span className="bp-live-dot" /> En directo</h2>
          {liveMatches.map((m) => (
            <MatchLine key={m.id} match={m} rich />
          ))}
        </section>
      )}

      <div className="bf-tour-grid-2">
        <section className="bf-tour-panel">
          <h2 className="bf-home-block-title">Próximos ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p className="bf-home-empty">Sin partidos próximos.</p>
          ) : (
            upcoming.slice(0, 8).map((m) => <MatchLine key={m.id} match={m} rich />)
          )}
        </section>
        <section className="bf-tour-panel">
          <h2 className="bf-home-block-title">Resultados</h2>
          {finished.length === 0 ? (
            <p className="bf-home-empty">Sin resultados aún.</p>
          ) : (
            finished.map((m) => <MatchLine key={m.id} match={m} rich />)
          )}
        </section>
      </div>

      {stats.standings.length > 0 && (
        <section className="bf-tour-section">
          <h2 className="bf-home-block-title">Clasificación</h2>
          <div className="bf-tour-standings">
            {stats.standings.slice(0, 12).map((row) => (
              <Link key={row.teamSlug} href={`/teams/${row.teamSlug}`} className="bf-tour-stand-row">
                <span className="bf-tour-stand-rank">{row.rank}</span>
                <TeamLogo slug={row.teamSlug} name={teamName(row.teamSlug)} size={32} />
                <strong>{teamName(row.teamSlug)}</strong>
                <span>{row.w}W · {row.l}L · {row.diff}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bf-tour-section">
        <div className="bf-home-block-head">
          <h2 className="bf-home-block-title">Participantes ({participants.length})</h2>
        </div>
        <div className="bf-tour-participants">
          {participants.slice(0, 32).map((ts) => (
            <Link key={ts} href={`/teams/${ts}`} className="bf-tour-part-chip">
              <TeamLogo slug={ts} name={teamName(ts)} size={40} />
              <span>{teamName(ts)}</span>
            </Link>
          ))}
        </div>
      </section>

      {fantasyEnabled && fantasyPool.length > 0 && (
        <section className="bf-tour-section">
          <div className="bf-home-block-head">
            <h2 className="bf-home-block-title">Pool fantasy</h2>
            <Link href={`/fantasy?tournament=${slug}`} className="bf-home-link">Mercado</Link>
          </div>
          <p className="bf-tour-pool-hint">
            {fantasyTeams.length} equipos con roster · {fantasyPool.length}+ pros disponibles
          </p>
          <div className="bf-tour-fantasy-cards">
            {fantasyPool.map((ps) => {
              const p = getPlayer(ps);
              if (!p) return null;
              return (
                <PlayerCard
                  key={ps}
                  playerSlug={ps}
                  size="sm"
                  price={getPlayerPrice(ps, slug)}
                  href={`/players/${ps}`}
                />
              );
            })}
          </div>
        </section>
      )}

      {stats.prizeBreakdown.length > 0 && (
        <section className="bf-tour-section">
          <h2 className="bf-home-block-title">Distribución de premios</h2>
          <div className="bf-tour-prizes">
            {stats.prizeBreakdown.map((p) => (
              <div key={p.place} className="bf-tour-prize-row">
                <span>{p.place}</span>
                <strong>{p.prize}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
