"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PulseCard, PulseMatchRow } from "./PulseUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  CATALOG_STATS,
  getLiveMatches,
  getUpcomingMatches,
  getCuratedHomeMatches,
  getLatestNews,
  getPlayer,
  openPredictions,
  teams,
  tournamentName,
  teamName,
  userPredictorProfile,
  isKnownTeamSlug,
  getPredictionLabel,
  getPredictionTournament,
} from "@/lib/data";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getUserSquad,
  getSquadValue,
  FANTASY_BUDGET,
  getTournamentFantasyProfile,
  getPlayerPrice,
} from "@/lib/data/fantasy";

export function PulseHome() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const upcoming = getUpcomingMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "results");
  const matches = useMemo(() => getCuratedHomeMatches(tab, 6), [tab]);

  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const picks = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const squadVal = getSquadValue(squad);
  const news = getLatestNews(4);
  const votes = openPredictions.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)).slice(0, 2);
  const topTeams = teams.slice(0, 6);

  return (
    <>
      <header className="pl-hero">
        {live.length > 0 && (
          <div className="pl-hero-badge">
            <span className="pl-live-dot" />
            {live.length} en vivo
          </div>
        )}
        <h1 className="pl-hero-title">
          Brawl Stars <span>Esports</span>
        </h1>
        <p className="pl-hero-sub">
          Partidos, picks, votaciones y rankings BSC. Todo claro, todo en un sitio.
        </p>
        <div className="pl-hero-actions">
          <Link href="/matches" className="pl-btn pl-btn-gold">Partidos</Link>
          <Link href="/fantasy" className="pl-btn pl-btn-blue">Pro Picks</Link>
          <Link href="/predictions" className="pl-btn pl-btn-red">Vota</Link>
        </div>
      </header>

      <div className="pl-stats">
        <div className="pl-stat"><div className="pl-stat-val pl-red">{live.length}</div><div className="pl-stat-lbl">Live</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-blue">{upcoming.length}</div><div className="pl-stat-lbl">Próximos</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-gold">{CATALOG_STATS.teams}</div><div className="pl-stat-lbl">Equipos</div></div>
        <div className="pl-stat"><div className="pl-stat-val">{userPredictorProfile.totalPoints}</div><div className="pl-stat-lbl">Tus pts</div></div>
      </div>

      <div className="pl-grid-main">
        <PulseCard title="Partidos" href="/matches" tabs={
          <div className="pl-tabs">
            <button type="button" className={`pl-tab ${tab === "live" ? "is-on-red" : ""}`} onClick={() => setTab("live")}>Live</button>
            <button type="button" className={`pl-tab ${tab === "upcoming" ? "is-on" : ""}`} onClick={() => setTab("upcoming")}>Próximos</button>
            <button type="button" className={`pl-tab ${tab === "results" ? "is-on-gold" : ""}`} onClick={() => setTab("results")}>Resultados</button>
          </div>
        }>
          {matches.length ? matches.map((m) => <PulseMatchRow key={m.id} match={m} />) : (
            <div className="pl-empty">No hay partidos confirmados aquí.</div>
          )}
        </PulseCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PulseCard title="Pro Picks" href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}>
            <div className="pl-picks-head">
              <TournamentLogo slug={DEFAULT_FANTASY_TOURNAMENT} name="BSC" size={36} />
              <div>
                <div style={{ fontWeight: 700 }}>{tournamentName(DEFAULT_FANTASY_TOURNAMENT)}</div>
                <div className="pl-dim" style={{ fontSize: 12 }}>Tu alineación</div>
              </div>
              <div className="pl-picks-stats">
                <div className="pl-picks-stat"><strong className="pl-gold">{picks.totalPoints}</strong><span>pts</span></div>
                <div className="pl-picks-stat"><strong className="pl-blue">#{picks.rank.toLocaleString()}</strong><span>rank</span></div>
                <div className="pl-picks-stat"><strong>${squadVal}M</strong><span>cap</span></div>
              </div>
            </div>
            {squad.map((slot, i) => {
              const p = getPlayer(slot.playerSlug);
              if (!p?.teamSlug) return null;
              return (
                <Link key={slot.playerSlug} href={`/players/${p.slug}`} className="pl-row">
                  <span className="pl-row-rank">{i + 1}</span>
                  <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={32} />
                  <div className="pl-row-main">
                    <div className="pl-row-title">
                      {p.ign}
                      {slot.isCaptain && <span className="pl-mvp">MVP</span>}
                    </div>
                    <div className="pl-row-sub">{teamName(p.teamSlug)}</div>
                  </div>
                  <span className="pl-row-val pl-blue">{getPlayerPrice(p.slug)}M</span>
                </Link>
              );
            })}
          </PulseCard>

          <PulseCard title="Vota" href="/predictions">
            {votes.map((e) => (
              <div key={e.id} className="pl-vote">
                <div className="pl-vote-meta">{getPredictionTournament(e)} · +{e.rewardPoints} pts</div>
                <div className="pl-vote-clash">
                  <div className="pl-vote-side">
                    <button type="button">
                      <TeamLogo slug={e.teamASlug} name={teamName(e.teamASlug)} size={36} />
                      <div style={{ fontWeight: 700, marginTop: 8, fontSize: 13 }}>{getPredictionLabel(e, "A")}</div>
                    </button>
                    <div className="pl-vote-pct pl-blue">{e.pickAPct}%</div>
                  </div>
                  <span className="pl-match-vs">VS</span>
                  <div className="pl-vote-side">
                    <button type="button">
                      <TeamLogo slug={e.teamBSlug} name={teamName(e.teamBSlug)} size={36} />
                      <div style={{ fontWeight: 700, marginTop: 8, fontSize: 13 }}>{getPredictionLabel(e, "B")}</div>
                    </button>
                    <div className="pl-vote-pct pl-red">{e.pickBPct}%</div>
                  </div>
                </div>
              </div>
            ))}
          </PulseCard>
        </div>
      </div>

      <div className="pl-grid-3" style={{ marginTop: 20 }}>
        <PulseCard title="Top equipos" href="/rankings">
          {topTeams.map((t) => (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="pl-row">
              <span className={`pl-row-rank ${t.rank <= 3 ? "top" : ""}`}>{t.rank}</span>
              <TeamLogo slug={t.slug} name={t.name} size={32} />
              <div className="pl-row-main">
                <div className="pl-row-title">{t.name}</div>
                <div className="pl-row-sub">{t.region}</div>
              </div>
            </Link>
          ))}
        </PulseCard>

        <PulseCard title="Noticias" href="/news">
          {news.map((a) => (
            <Link key={a.slug} href={`/news/${a.slug}`} className="pl-news">
              <div className="pl-news-cat">{a.category}</div>
              <div className="pl-news-title">{a.title}</div>
              <div className="pl-news-date">{new Date(a.date).toLocaleDateString("es-ES")}</div>
            </Link>
          ))}
        </PulseCard>

        <PulseCard title="Acceso rápido">
          <div className="pl-card-body-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/pickems" className="pl-btn pl-btn-gold" style={{ width: "100%" }}>Pick&apos;em Bracket</Link>
            <Link href="/players" className="pl-btn pl-btn-ghost" style={{ width: "100%" }}>Jugadores</Link>
            <Link href="/tournaments" className="pl-btn pl-btn-ghost" style={{ width: "100%" }}>Torneos</Link>
            <div className="pl-progress" style={{ marginTop: 8 }}><div style={{ width: "38%" }} /></div>
            <p className="pl-dim" style={{ fontSize: 12, margin: 0, textAlign: "center" }}>Pick&apos;em WF · 12/32</p>
          </div>
        </PulseCard>
      </div>
    </>
  );
}
