"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Panel } from "@/components/platform/Panel";
import { MatchLine } from "@/components/platform/MatchLine";
import { PlayerRow } from "@/components/platform/PlayerRow";
import { PredictBlock } from "@/components/platform/PredictBlock";
import { NewsLine } from "@/components/platform/NewsLine";
import { TeamTile } from "@/components/platform/TeamTile";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  CATALOG_STATS,
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  getTopFantasyPlayers,
  getPlayer,
  openPredictions,
  teams,
  getBscCircuitTournaments,
  tournamentName,
  userPredictorProfile,
} from "@/lib/data";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getUserSquad,
  getSquadValue,
  FANTASY_BUDGET,
  getTournamentFantasyProfile,
  getPlayerPrice,
} from "@/lib/data/fantasy";
import { useLatestNewsMerged } from "@/hooks/useMergedNews";

export function DashboardHome() {
  const live = getLiveMatches();
  const upcoming = getUpcomingMatches();
  const recent = getRecentMatches(6);
  const matchFeed = [...live, ...upcoming.slice(0, 10), ...recent];
  const topPros = getTopFantasyPlayers(8);
  const news = useLatestNewsMerged(5);
  const votes = openPredictions.filter((p) => p.featured).slice(0, 2);
  const voteList = votes.length ? votes : openPredictions.slice(0, 2);
  const topTeams = teams.slice(0, 6);
  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const fantasyProfile = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const squadValue = getSquadValue(squad);
  const budgetPct = Math.round((squadValue / FANTASY_BUDGET) * 100);
  const featuredTourney = getBscCircuitTournaments().find((t) => t.status !== "finished");

  return (
    <>
      {/* Quick stats bar */}
      <div className="es-page-stats" style={{ marginBottom: 12 }}>
        <div className="es-stat es-stat-red">
          <div className="es-stat-val">{live.length}</div>
          <div className="es-stat-lbl">Live</div>
        </div>
        <div className="es-stat es-stat-blue">
          <div className="es-stat-val">{upcoming.length}</div>
          <div className="es-stat-lbl">Próximos</div>
        </div>
        <div className="es-stat es-stat-gold">
          <div className="es-stat-val">{CATALOG_STATS.players}</div>
          <div className="es-stat-lbl">Pros</div>
        </div>
        <div className="es-stat es-stat-blue">
          <div className="es-stat-val">{openPredictions.length}</div>
          <div className="es-stat-lbl">Votos</div>
        </div>
        <div className="es-stat es-stat-gold">
          <div className="es-stat-val">#{userPredictorProfile.rank}</div>
          <div className="es-stat-lbl">Tu rank</div>
        </div>
      </div>

      <div className="es-dash">
        {/* Primary: match center */}
        <div className="es-dash-primary">
          <Panel title="Centro de partidos" href="/matches" accent="red">
            {matchFeed.slice(0, 14).map((m) => (
              <MatchLine key={m.id} match={m} />
            ))}
          </Panel>
        </div>

        {/* Sidebar */}
        <div className="es-dash-side">
          <Panel title="Mi fantasy" href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} accent="gold">
            <div className="es-fantasy-dock">
              <div className="flex items-center gap-3 mb-3">
                <TournamentLogo slug={DEFAULT_FANTASY_TOURNAMENT} name="BSC" size={36} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{tournamentName(DEFAULT_FANTASY_TOURNAMENT)}</div>
                  <div style={{ fontSize: 11, color: "var(--es-dim)" }}>
                    {fantasyProfile.totalPoints} pts · Rank #{fantasyProfile.rank.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="es-fantasy-budget">
                <span>Presupuesto</span>
                <span style={{ color: "var(--es-gold)" }}>
                  ${squadValue} / ${FANTASY_BUDGET}
                </span>
              </div>
              <div className="es-fantasy-bar">
                <div className="es-fantasy-bar-fill" style={{ width: `${budgetPct}%` }} />
              </div>
              {squad.slice(0, 5).map((slot, i) => {
                const p = getPlayer(slot.playerSlug);
                if (!p) return null;
                return (
                  <PlayerRow
                    key={slot.playerSlug}
                    player={p}
                    rank={i + 1}
                    price={getPlayerPrice(slot.playerSlug)}
                  />
                );
              })}
              <Link
                href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}
                className="es-btn es-btn-gold"
                style={{ width: "100%", marginTop: 10 }}
              >
                Gestionar plantilla
              </Link>
            </div>
          </Panel>

          {featuredTourney && (
            <Panel title="Torneo activo" href={`/tournaments/${featuredTourney.slug}`} accent="blue">
              <div className="es-panel-body-pad">
                <div className="flex items-center gap-3">
                  <TournamentLogo slug={featuredTourney.slug} name={featuredTourney.shortName} size={40} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{featuredTourney.name}</div>
                    <div style={{ fontSize: 11, color: "var(--es-dim)" }}>{featuredTourney.region}</div>
                  </div>
                  <span className="es-tag es-tag-live ml-auto">{featuredTourney.status}</span>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Row 2: predictions, pickem, rankings */}
      <div className="es-dash-row es-dash-row-3">
        <Panel title="Vota ahora" href="/predictions" accent="red">
          {voteList.map((e) => (
            <PredictBlock key={e.id} event={e} />
          ))}
        </Panel>

        <Panel title="Pick'em" href="/pickems" accent="gold">
          <div className="es-panel-body-pad">
            <div className="flex items-center gap-3 mb-3">
              <TournamentLogo slug="world-finals-2026" name="WF" size={40} />
              <div>
                <div style={{ fontWeight: 700 }}>World Finals 2026</div>
                <div style={{ fontSize: 11, color: "var(--es-dim)" }}>Tokio · Bracket oficial</div>
              </div>
            </div>
            <div className="es-fantasy-bar mb-3">
              <div className="es-fantasy-bar-fill" style={{ width: "38%", background: "var(--es-gold)" }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--es-muted)", marginBottom: 12 }}>
              38% completado · 12/32 picks
            </p>
            <Link href="/pickems" className="es-btn es-btn-ghost" style={{ width: "100%" }}>
              <Trophy className="h-4 w-4" />
              Abrir bracket
            </Link>
          </div>
        </Panel>

        <Panel title="Rankings" href="/rankings" accent="blue">
          {topTeams.map((t) => (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="es-row">
              <span className={`es-row-rank ${t.rank <= 3 ? "top" : ""}`}>#{t.rank}</span>
              <span className="es-row-main">
                <div className="es-row-title">{t.tag}</div>
                <div className="es-row-sub">{t.name}</div>
              </span>
              <span className="es-row-val">${(t.earnings / 1000).toFixed(0)}K</span>
            </Link>
          ))}
        </Panel>
      </div>

      {/* Row 3: players + news + teams grid */}
      <div className="es-dash-row es-dash-row-2" style={{ marginTop: 12 }}>
        <Panel title="Top pros fantasy" href="/players" accent="gold">
          {topPros.map((p, i) => (
            <PlayerRow key={p.slug} player={p} rank={i + 1} price={getPlayerPrice(p.slug)} />
          ))}
        </Panel>

        <Panel title="Noticias esports" href="/news">
          {news.map((a) => (
            <NewsLine key={a.slug} article={a} />
          ))}
        </Panel>
      </div>

      <div style={{ marginTop: 12 }}>
        <Panel title="Equipos del circuito" href="/teams" linkLabel={`Ver ${CATALOG_STATS.teams} equipos →`}>
          <div className="es-panel-body-pad">
            <div className="es-grid-teams">
              {topTeams.map((t) => (
                <TeamTile key={t.slug} team={t} />
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
