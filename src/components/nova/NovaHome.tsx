"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NovaBlock } from "./NovaBlock";
import { NovaPageHero } from "./NovaPageHero";
import { HomeMatchFeed } from "./HomeMatchFeed";
import { ClubRow } from "@/components/esports/ClubRow";
import { PredictionMatchCard } from "@/components/predictions/PredictionMatchCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  CATALOG_STATS,
  getLiveMatches,
  getUpcomingMatches,
  getCuratedHomeMatches,
  getTopFantasyPlayers,
  getLatestNews,
  getPlayer,
  openPredictions,
  teams,
  tournamentName,
  teamName,
  userPredictorProfile,
  isKnownTeamSlug,
} from "@/lib/data";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getUserSquad,
  getSquadValue,
  FANTASY_BUDGET,
  getTournamentFantasyProfile,
  getPlayerPrice,
} from "@/lib/data/fantasy";

export function NovaHome() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const upcoming = getUpcomingMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "upcoming");
  const tabMatches = useMemo(() => getCuratedHomeMatches(tab, 8), [tab]);

  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const fantasyProfile = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const squadValue = getSquadValue(squad);
  const topPros = getTopFantasyPlayers(6);
  const news = getLatestNews(5);
  const votes = openPredictions
    .filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug))
    .slice(0, 4);
  const featuredVote = votes.find((e) => e.featured) ?? votes[0];
  const topTeams = teams.slice(0, 8);

  return (
    <>
      <NovaPageHero
        live={live.length > 0}
        kicker={live.length > 0 ? `${live.length} en vivo · BSC 2026` : "BSC 2026 · Cobertura competitiva"}
        title="Esports Brawl Stars"
        accent="Datos en vivo."
        subtitle="Pro Picks, votaciones y partidos BSC con equipos confirmados."
        actions={
          <>
            <Link href="/fantasy" className="nv-btn nv-btn-yellow">Pro Picks</Link>
            <Link href="/predictions" className="nv-btn nv-btn-red">Vota</Link>
            <Link href="/matches" className="nv-btn nv-btn-blue">Partidos</Link>
          </>
        }
      />

      <div className="nv-kpis">
        <div className="nv-kpi"><div className="nv-kpi-val c-red">{live.length}</div><div className="nv-kpi-lbl">Live</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-blue">{upcoming.length}</div><div className="nv-kpi-lbl">Próximos</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-yellow">{CATALOG_STATS.players}</div><div className="nv-kpi-lbl">Pros</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-red">{openPredictions.length}</div><div className="nv-kpi-lbl">Votos</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-yellow">#{userPredictorProfile.rank}</div><div className="nv-kpi-lbl">Rank</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-blue">{userPredictorProfile.totalPoints}</div><div className="nv-kpi-lbl">Pts</div></div>
      </div>

      <div className="nv-split nv-split-main">
        <NovaBlock
          title="Partidos BSC"
          href="/matches"
          tabs={
            <div className="nv-tabs">
              <button type="button" className={`nv-tab ${tab === "live" ? "is-on-pink" : ""}`} onClick={() => setTab("live")}>
                Live ({live.length})
              </button>
              <button type="button" className={`nv-tab ${tab === "upcoming" ? "is-on" : ""}`} onClick={() => setTab("upcoming")}>
                Próximos
              </button>
              <button type="button" className={`nv-tab ${tab === "results" ? "is-on-yellow" : ""}`} onClick={() => setTab("results")}>
                Resultados
              </button>
            </div>
          }
        >
          <HomeMatchFeed matches={tabMatches} />
        </NovaBlock>

        <div className="home-side-stack">
          <NovaBlock title="Pro Picks" href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}>
            <div className="bc-home-picks">
              <div className="bc-home-picks-event">
                <TournamentLogo slug={DEFAULT_FANTASY_TOURNAMENT} name="BSC" size={36} />
                <div>
                  <div className="bc-home-picks-title">{tournamentName(DEFAULT_FANTASY_TOURNAMENT)}</div>
                  <div className="nv-dim" style={{ fontSize: 11 }}>Tu alineación activa</div>
                </div>
              </div>
              <div className="bc-home-picks-stats">
                <div className="bc-home-picks-stat"><strong className="c-yellow">{fantasyProfile.totalPoints}</strong>pts</div>
                <div className="bc-home-picks-stat"><strong className="c-blue">#{fantasyProfile.rank.toLocaleString()}</strong>rank</div>
                <div className="bc-home-picks-stat"><strong>${squadValue}M</strong>/{FANTASY_BUDGET}M</div>
              </div>
            </div>
            <table className="es-table es-table-premium">
              <thead>
                <tr><th>#</th><th>Pro</th><th>Club</th><th style={{ textAlign: "right" }}>Val</th></tr>
              </thead>
              <tbody>
                {squad.map((slot, i) => {
                  const p = getPlayer(slot.playerSlug);
                  if (!p || !p.teamSlug) return null;
                  return (
                    <tr key={slot.playerSlug} className={`es-pro-row ${slot.isCaptain ? "es-pro-row-captain" : ""}`}>
                      <td className="es-pro-rank">{i + 1}</td>
                      <td className="es-pro-main">
                        <Link href={`/players/${p.slug}`} className="es-pro-link">
                          <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={22} />
                          <span className="es-pro-name">{p.ign}</span>
                          {slot.isCaptain && <span className="es-pro-mvp">MVP</span>}
                        </Link>
                      </td>
                      <td className="es-pro-cell nv-dim">{teamName(p.teamSlug)}</td>
                      <td className="es-pro-cell es-pro-num c-blue" style={{ textAlign: "right" }}>{getPlayerPrice(p.slug)}M</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </NovaBlock>

          <NovaBlock title="Vota ahora" href="/predictions">
            <div className="home-votes">
              {featuredVote && <PredictionMatchCard event={featuredVote} featured />}
              {votes.slice(1, 3).map((e) => (
                <PredictionMatchCard key={e.id} event={e} />
              ))}
            </div>
          </NovaBlock>
        </div>
      </div>

      <div className="nv-split nv-split-3" style={{ marginTop: 14 }}>
        <NovaBlock title="Top pros" href="/players">
          <table className="es-table es-table-premium">
            <thead><tr><th>#</th><th>Pro</th><th>Rating</th><th style={{ textAlign: "right" }}>Val</th></tr></thead>
            <tbody>
              {topPros.map((p, i) => (
                p.teamSlug ? (
                  <tr key={p.slug} className="es-pro-row">
                    <td className={`es-pro-rank ${i < 3 ? "es-pro-rank-top" : ""}`}>{i + 1}</td>
                    <td className="es-pro-main">
                      <Link href={`/players/${p.slug}`} className="es-pro-link">
                        <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={22} />
                        <span className="es-pro-name">{p.ign}</span>
                      </Link>
                    </td>
                    <td className="es-pro-cell es-pro-num c-yellow">{p.rating.toFixed(1)}</td>
                    <td className="es-pro-cell es-pro-num c-blue" style={{ textAlign: "right" }}>{getPlayerPrice(p.slug)}M</td>
                  </tr>
                ) : null
              ))}
            </tbody>
          </table>
        </NovaBlock>

        <NovaBlock title="Rankings" href="/rankings">
          <table className="es-table es-table-premium">
            <thead><tr><th>#</th><th>Club</th><th style={{ textAlign: "right" }}>$</th></tr></thead>
            <tbody>
              {topTeams.slice(0, 8).map((t) => (
                <tr key={t.slug} className={`es-pro-row ${t.rank <= 3 ? `es-pro-row-${t.rank === 1 ? "gold" : t.rank === 2 ? "silver" : "bronze"}` : ""}`}>
                  <td className={`es-pro-rank ${t.rank <= 3 ? "es-pro-rank-top" : ""}`}>{t.rank}</td>
                  <td className="es-pro-main">
                    <Link href={`/teams/${t.slug}`} className="es-pro-link">
                      <TeamLogo slug={t.slug} name={t.name} size={24} />
                      <span className="es-pro-name">{t.tag}</span>
                    </Link>
                  </td>
                  <td className="es-pro-cell es-pro-num" style={{ textAlign: "right" }}>${(t.earnings / 1000).toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </NovaBlock>

        <NovaBlock title="Pick'em" href="/pickems">
          <div className="bc-home-picks">
            <div className="bc-home-picks-event">
              <TournamentLogo slug="world-finals-2026" name="WF" size={36} />
              <div>
                <div className="bc-home-picks-title">World Finals 2026</div>
                <div className="nv-dim" style={{ fontSize: 11 }}>Bracket eliminatorio</div>
              </div>
            </div>
            <div className="bc-home-picks-stats">
              <div className="bc-home-picks-stat"><strong className="c-yellow">12</strong>/32</div>
              <div className="bc-home-picks-stat"><strong className="c-blue">38%</strong>done</div>
            </div>
            <div className="nv-progress" style={{ marginTop: 10 }}><div style={{ width: "38%" }} /></div>
            <Link href="/pickems" className="nv-btn nv-btn-yellow" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>Abrir bracket</Link>
          </div>
        </NovaBlock>
      </div>

      <div className="nv-split nv-split-2" style={{ marginTop: 14 }}>
        <NovaBlock title="Noticias" href="/news">
          {news.map((a) => (
            <Link key={a.slug} href={`/news/${a.slug}`} className="nv-news">
              <div className="nv-news-cat">{a.category}</div>
              <div className="nv-news-title">{a.title}</div>
              <div className="nv-news-date">{new Date(a.date).toLocaleDateString("es-ES")}</div>
            </Link>
          ))}
        </NovaBlock>

        <NovaBlock title="Organizaciones" href="/teams">
          <table className="es-table es-table-premium">
            <thead><tr><th>#</th><th>Club</th><th>Región</th><th style={{ textAlign: "right" }}>$</th></tr></thead>
            <tbody>
              {topTeams.map((t) => (
                <ClubRow key={t.slug} team={t} showForm={false} />
              ))}
            </tbody>
          </table>
        </NovaBlock>
      </div>
    </>
  );
}
