"use client";

import { useState } from "react";
import Link from "next/link";
import { Widget } from "./Widget";
import { MatchTable } from "./MatchTable";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  CATALOG_STATS,
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  getTopFantasyPlayers,
  getLatestNews,
  getPlayer,
  openPredictions,
  teams,
  teamName,
  tournamentName,
  userPredictorProfile,
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

export function CommandCenter() {
  const live = getLiveMatches();
  const upcoming = getUpcomingMatches();
  const recent = getRecentMatches(12);
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(
    live.length ? "live" : "upcoming"
  );

  const tabMatches =
    tab === "live" ? live : tab === "upcoming" ? upcoming.slice(0, 15) : recent;

  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const fantasyProfile = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const squadValue = getSquadValue(squad);
  const topPros = getTopFantasyPlayers(6);
  const news = getLatestNews(6);
  const votes = openPredictions.slice(0, 3);
  const topTeams = teams.slice(0, 8);

  return (
    <>
      <div className="x-kpi-row">
        <div className="x-kpi">
          <div className="x-kpi-val c-red">{live.length}</div>
          <div className="x-kpi-lbl">En vivo</div>
        </div>
        <div className="x-kpi">
          <div className="x-kpi-val c-blue">{upcoming.length}</div>
          <div className="x-kpi-lbl">Próximos</div>
        </div>
        <div className="x-kpi">
          <div className="x-kpi-val c-gold">{CATALOG_STATS.players}</div>
          <div className="x-kpi-lbl">Jugadores</div>
        </div>
        <div className="x-kpi">
          <div className="x-kpi-val c-blue">{openPredictions.length}</div>
          <div className="x-kpi-lbl">Votos abiertos</div>
        </div>
        <div className="x-kpi">
          <div className="x-kpi-val c-gold">#{userPredictorProfile.rank}</div>
          <div className="x-kpi-lbl">Tu ranking</div>
        </div>
        <div className="x-kpi">
          <div className="x-kpi-val c-gold">{userPredictorProfile.totalPoints}</div>
          <div className="x-kpi-lbl">Puntos voto</div>
        </div>
      </div>

      <div className="x-grid-2">
        <Widget title="Match center" href="/matches">
          <div className="x-tabs">
            <button
              type="button"
              className={`x-tab ${tab === "live" ? "is-on-red" : ""}`}
              onClick={() => setTab("live")}
            >
              Live ({live.length})
            </button>
            <button
              type="button"
              className={`x-tab ${tab === "upcoming" ? "is-on" : ""}`}
              onClick={() => setTab("upcoming")}
            >
              Próximos
            </button>
            <button
              type="button"
              className={`x-tab ${tab === "results" ? "is-on" : ""}`}
              onClick={() => setTab("results")}
            >
              Resultados
            </button>
          </div>
          <MatchTable matches={tabMatches} />
        </Widget>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Widget
            title="Fantasy · BSC"
            href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}
          >
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <TournamentLogo slug={DEFAULT_FANTASY_TOURNAMENT} name="BSC" size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {tournamentName(DEFAULT_FANTASY_TOURNAMENT)}
                  </div>
                  <div className="x-td-dim">
                    {fantasyProfile.totalPoints} pts · Rank #{fantasyProfile.rank.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span className="x-td-dim">Presupuesto</span>
                <span className="x-td-mono x-td-gold">
                  ${squadValue} / ${FANTASY_BUDGET}
                </span>
              </div>
              <div className="x-progress">
                <div style={{ width: `${Math.round((squadValue / FANTASY_BUDGET) * 100)}%` }} />
              </div>
            </div>
            <table className="x-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>Club</th>
                  <th style={{ textAlign: "right" }}>$</th>
                </tr>
              </thead>
              <tbody>
                {squad.slice(0, 5).map((slot, i) => {
                  const p = getPlayer(slot.playerSlug);
                  if (!p) return null;
                  return (
                    <tr key={slot.playerSlug}>
                      <td className="x-td-mono x-td-dim">{i + 1}</td>
                      <td>
                        <Link href={`/players/${p.slug}`} style={{ color: "inherit", fontWeight: 600 }}>
                          {p.ign}
                          {slot.isCaptain && (
                            <span className="x-td-gold" style={{ fontSize: 9, marginLeft: 4 }}>
                              C
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="x-td-dim">{teamName(p.teamSlug)}</td>
                      <td className="x-td-mono x-td-blue" style={{ textAlign: "right" }}>
                        {getPlayerPrice(p.slug)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Widget>

          <Widget title="Votaciones" href="/predictions">
            {votes.map((e) => (
              <div key={e.id} className="x-vote-row">
                <div className="x-vote-meta">
                  {getPredictionTournament(e)} · {e.stage}
                </div>
                <div className="x-vote-pick">
                  <button type="button" className="x-vote-btn">
                    <TeamLogo slug={e.teamASlug} name={teamName(e.teamASlug)} size={18} />
                    {getPredictionLabel(e, "A")} ({e.pickAPct}%)
                  </button>
                  <button type="button" className="x-vote-btn">
                    <TeamLogo slug={e.teamBSlug} name={teamName(e.teamBSlug)} size={18} />
                    {getPredictionLabel(e, "B")} ({e.pickBPct}%)
                  </button>
                </div>
              </div>
            ))}
          </Widget>
        </div>
      </div>

      <div className="x-grid-3">
        <Widget title="Top pros" href="/players">
          <table className="x-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pro</th>
                <th>OVR</th>
                <th style={{ textAlign: "right" }}>$</th>
              </tr>
            </thead>
            <tbody>
              {topPros.map((p, i) => (
                <tr key={p.slug}>
                  <td className={`x-td-mono ${i < 3 ? "x-td-gold" : "x-td-dim"}`}>{i + 1}</td>
                  <td>
                    <Link href={`/players/${p.slug}`} className="x-td-team row-link">
                      <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={18} />
                      {p.ign}
                    </Link>
                  </td>
                  <td className="x-td-mono x-td-gold">{p.rating.toFixed(1)}</td>
                  <td className="x-td-mono x-td-blue" style={{ textAlign: "right" }}>
                    {getPlayerPrice(p.slug)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Widget>

        <Widget title="Rankings equipos" href="/rankings">
          <table className="x-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Equipo</th>
                <th style={{ textAlign: "right" }}>Premios</th>
              </tr>
            </thead>
            <tbody>
              {topTeams.slice(0, 8).map((t) => (
                <tr key={t.slug}>
                  <td className={`x-td-mono ${t.rank <= 3 ? "x-td-gold" : "x-td-dim"}`}>{t.rank}</td>
                  <td>
                    <Link href={`/teams/${t.slug}`} className="x-td-team row-link">
                      <TeamLogo slug={t.slug} name={t.name} size={18} />
                      {t.tag}
                    </Link>
                  </td>
                  <td className="x-td-mono" style={{ textAlign: "right" }}>
                    ${(t.earnings / 1000).toFixed(0)}K
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Widget>

        <Widget title="Pick'em WF26" href="/pickems">
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <TournamentLogo slug="world-finals-2026" name="WF" size={36} />
              <div>
                <div style={{ fontWeight: 700 }}>World Finals 2026</div>
                <div className="x-td-dim">Tokio · Bracket</div>
              </div>
            </div>
            <div className="x-progress" style={{ marginBottom: 8 }}>
              <div style={{ width: "38%" }} />
            </div>
            <p className="x-td-dim" style={{ fontSize: 11, marginBottom: 12 }}>
              12/32 picks · 38% completado
            </p>
            <Link href="/pickems" className="x-btn x-btn-line" style={{ width: "100%", justifyContent: "center" }}>
              Abrir bracket
            </Link>
          </div>
        </Widget>
      </div>

      <div className="x-grid-2 x-grid-2-wide" style={{ marginTop: 16 }}>
        <Widget title="Noticias" href="/news">
          {news.map((a) => (
            <Link key={a.slug} href={`/news/${a.slug}`} className="x-news">
              <div className="x-news-cat">{a.category}</div>
              <div className="x-news-title">{a.title}</div>
              <div className="x-news-date">
                {new Date(a.date).toLocaleDateString("es-ES")} · {a.readMinutes} min
              </div>
            </Link>
          ))}
        </Widget>

        <Widget title="Clubes" href="/teams">
          <div className="x-grid-cards">
            {topTeams.map((t) => (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="x-club">
                <div className="x-club-rank">#{t.rank}</div>
                <TeamLogo slug={t.slug} name={t.name} size={40} />
                <div className="x-club-tag">{t.tag}</div>
                <div className="x-club-name">{t.name}</div>
              </Link>
            ))}
          </div>
        </Widget>
      </div>
    </>
  );
}
