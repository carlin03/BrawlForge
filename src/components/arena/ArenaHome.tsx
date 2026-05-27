"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Zap, Target, TrendingUp, TrendingDown, ArrowRightLeft, Activity } from "lucide-react";
import { ArenaMatchLine, ArenaPanel, ArenaBadge, PriceChange } from "./ArenaUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  getLiveMatches,
  getCuratedHomeMatches,
  openPredictions,
  getPlayer,
  teamName,
  userPredictorProfile,
  isKnownTeamSlug,
  getPredictionLabel,
  getPredictionTournament,
  getRecentTransfers,
  getTrendingPlayers,
  getTopGainers,
  getTopLosers,
  getMvpOfWeek,
  getCommunityStats,
  getLiveActivity,
  getUpcomingTournamentsWidget,
  DEFAULT_FANTASY_TOURNAMENT,
  getUserSquad,
  getSquadValue,
  FANTASY_BUDGET,
  getPlayerPrice,
  getTournamentFantasyProfile,
  tournamentName,
  getFantasyRole,
  getPickRate,
} from "@/lib/data";

export function ArenaHome() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "upcoming");
  const matches = useMemo(() => getCuratedHomeMatches(tab, 8), [tab]);

  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const picks = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const squadVal = getSquadValue(squad);
  const votes = openPredictions
    .filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug))
    .slice(0, 3);

  const transfers = getRecentTransfers(5);
  const trending = getTrendingPlayers(5);
  const gainers = getTopGainers(3);
  const losers = getTopLosers(3);
  const mvp = getMvpOfWeek();
  const community = getCommunityStats();
  const activity = getLiveActivity(6);
  const upcomingTournaments = getUpcomingTournamentsWidget(3);
  const transfersLeft = picks.transfersAllowed - picks.transfersUsed;

  return (
    <>
      <section className="ar-hero">
        <div className="ar-hero-inner">
          {live.length > 0 && (
            <div className="ar-hero-kicker">
              <span className="ar-live-dot" />
              {live.length} en directo · {community.activeManagers.toLocaleString()} managers activos
            </div>
          )}
          <h1 className="ar-h1">
            Gana la semana.<br />
            <span className="ar-h1-gold">Domina el BSC.</span>
          </h1>
          <p className="ar-lead">
            Fantasy, votaciones y partidos en tiempo real. Dashboard competitivo para managers serios.
          </p>
          <div className="ar-hero-actions">
            <Link href="/fantasy" className="ar-btn ar-btn-pick">
              <Trophy size={16} /> Mi alineación
            </Link>
            <Link href="/predictions" className="ar-btn ar-btn-vote">
              <Target size={16} /> Votar
            </Link>
            {live.length > 0 && (
              <Link href="/matches" className="ar-btn ar-btn-live">
                <Zap size={16} /> Live
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="ar-meta-row">
        <div className="ar-meta-item">
          <strong className="gold">{picks.totalPoints}</strong>
          <span>Pts fantasy</span>
        </div>
        <div className="ar-meta-item">
          <strong>{userPredictorProfile.totalPoints}</strong>
          <span>Votaciones</span>
        </div>
        <div className="ar-meta-item">
          <strong className="gold">#{picks.rank.toLocaleString()}</strong>
          <span>Ranking</span>
        </div>
        <div className="ar-meta-item">
          <strong>{userPredictorProfile.streak}</strong>
          <span>Racha votos</span>
        </div>
        <div className="ar-meta-item">
          <strong>{transfersLeft}</strong>
          <span>Fichajes libres</span>
        </div>
        <div className="ar-meta-item">
          <strong style={{ color: live.length ? "var(--ar-live)" : undefined }}>{live.length}</strong>
          <span>En directo</span>
        </div>
      </div>

      <div className="ar-home-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ar-gap-lg)" }}>
          <ArenaPanel
            className="ar-stagger-1"
            title="Partidos"
            href="/matches"
            tabs={
              <div className="ar-tabs">
                <button type="button" className={`ar-tab is-live ${tab === "live" ? "is-on" : ""}`} onClick={() => setTab("live")}>Live</button>
                <button type="button" className={`ar-tab ${tab === "upcoming" ? "is-on" : ""}`} onClick={() => setTab("upcoming")}>Próximos</button>
                <button type="button" className={`ar-tab ${tab === "results" ? "is-on" : ""}`} onClick={() => setTab("results")}>Resultados</button>
              </div>
            }
          >
            {matches.length ? matches.map((m) => <ArenaMatchLine key={m.id} match={m} />) : (
              <div className="ar-empty">Sin partidos — prueba otra pestaña.</div>
            )}
          </ArenaPanel>

          <div className="ar-dash-grid-2">
            <ArenaPanel title="Actividad en vivo" compact>
              {activity.map((a) => (
                <div key={a.id} className="ar-compact-row" style={{ cursor: "default" }}>
                  <Activity size={14} style={{ color: a.accent === "red" ? "var(--ar-live)" : a.accent === "blue" ? "var(--ar-vote)" : "var(--ar-pick)", flexShrink: 0 }} />
                  <div className="ar-compact-main">
                    <div className="ar-compact-title">{a.text}</div>
                  </div>
                  <span className="ar-compact-sub">{a.ago}</span>
                </div>
              ))}
            </ArenaPanel>

            <ArenaPanel title="Fichajes recientes" href="/fantasy" linkLabel="Mercado">
              {transfers.map((t) => {
                const p = getPlayer(t.playerSlug);
                if (!p?.teamSlug) return null;
                return (
                  <Link key={t.playerSlug + t.ago} href={`/players/${p.slug}`} className="ar-compact-row">
                    <ArrowRightLeft size={14} style={{ color: t.type === "in" ? "#5ee89a" : "var(--ar-live)", flexShrink: 0 }} />
                    <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={24} />
                    <div className="ar-compact-main">
                      <div className="ar-compact-title">{p.ign}</div>
                      <div className="ar-compact-sub">{t.type === "in" ? "Entrada" : "Salida"} · {teamName(p.teamSlug)}</div>
                    </div>
                    <span className="ar-compact-stat" style={{ color: "var(--ar-pick)" }}>{t.price}M</span>
                    <span className="ar-compact-sub">{t.ago}</span>
                  </Link>
                );
              })}
            </ArenaPanel>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ar-gap-lg)" }}>
          <ArenaPanel className="ar-stagger-2" title="Tu plantilla" href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} linkLabel="Editar" compact>
            <div className="ar-panel-pad" style={{ borderBottom: "1px solid var(--ar-line)", paddingTop: 10, paddingBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span className="ar-badge ar-badge-gold">{tournamentName(DEFAULT_FANTASY_TOURNAMENT)}</span>
                <span style={{ fontSize: 11, color: "var(--ar-dim)" }}>{transfersLeft} fichajes · {picks.rankChange > 0 ? "+" : ""}{picks.rankChange} pos</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ar-muted)", marginTop: 6 }}>
                {picks.totalPoints} pts · #{picks.rank.toLocaleString()} · ${squadVal}M / ${FANTASY_BUDGET}M
              </div>
            </div>
            {squad.length ? squad.map((slot) => {
              const p = getPlayer(slot.playerSlug);
              if (!p?.teamSlug) return null;
              return (
                <Link key={slot.playerSlug} href={`/players/${p.slug}`} className="ar-compact-row">
                  <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={28} />
                  <div className="ar-compact-main">
                    <div className="ar-compact-title">
                      {p.ign}
                      {slot.isCaptain && <span className="ar-mvp">C</span>}
                    </div>
                    <div className="ar-compact-sub">{getFantasyRole(p.slug)} · {getPickRate(p.slug)}% prop.</div>
                  </div>
                  <span className="ar-compact-stat">{slot.eventPoints || "—"}</span>
                  <span className="ar-compact-stat" style={{ color: "var(--ar-pick)" }}>{getPlayerPrice(p.slug)}M</span>
                </Link>
              );
            }) : (
              <div className="ar-empty">
                <Link href="/fantasy" style={{ color: "var(--ar-pick)", fontWeight: 700 }}>Monta tu trío →</Link>
              </div>
            )}
          </ArenaPanel>

          {mvp && (
            <ArenaPanel title="MVP de la semana" href={`/players/${mvp.playerSlug}`} linkLabel="Perfil" compact>
              <Link href={`/players/${mvp.playerSlug}`} className="ar-compact-row">
                <TeamLogo slug={mvp.teamSlug} name={teamName(mvp.teamSlug)} size={36} />
                <div className="ar-compact-main">
                  <div className="ar-compact-title" style={{ fontSize: 15 }}>{mvp.ign}</div>
                  <div className="ar-compact-sub">{mvp.role} · {mvp.ownership}% propiedad · {teamName(mvp.teamSlug)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="ar-compact-stat" style={{ color: "var(--ar-pick)", fontSize: 16 }}>{mvp.points}</div>
                  <div className="ar-compact-sub">pts</div>
                </div>
              </Link>
            </ArenaPanel>
          )}

          <ArenaPanel className="ar-stagger-3" title="Votaciones" href="/predictions" linkLabel="Todas" compact>
            {votes.length ? votes.map((e) => (
              <div key={e.id} className="ar-poll" style={{ padding: "14px 16px" }}>
                <div className="ar-poll-meta" style={{ marginBottom: 10 }}>
                  {getPredictionTournament(e)} · +{e.rewardPoints} pts · {(e.totalVotes / 1000).toFixed(1)}K votos
                </div>
                <div className="ar-poll-teams" style={{ gap: 8, marginBottom: 10 }}>
                  <button type="button" className="ar-poll-btn" style={{ padding: "12px 10px" }}>
                    <TeamLogo slug={e.teamASlug} name={teamName(e.teamASlug)} size={36} />
                    <span className="ar-poll-btn-name" style={{ fontSize: 12 }}>{getPredictionLabel(e, "A")}</span>
                  </button>
                  <button type="button" className="ar-poll-btn" style={{ padding: "12px 10px" }}>
                    <TeamLogo slug={e.teamBSlug} name={teamName(e.teamBSlug)} size={36} />
                    <span className="ar-poll-btn-name" style={{ fontSize: 12 }}>{getPredictionLabel(e, "B")}</span>
                  </button>
                </div>
                <div className="ar-poll-bar">
                  <div className="ar-poll-bar-a" style={{ width: `${e.pickAPct}%` }} />
                  <div className="ar-poll-bar-b" style={{ width: `${e.pickBPct}%` }} />
                </div>
                <div className="ar-poll-pcts">
                  <span>{e.pickAPct}%</span>
                  <span>{e.pickBPct}%</span>
                </div>
              </div>
            )) : (
              <div className="ar-empty">Sin votaciones abiertas.</div>
            )}
          </ArenaPanel>
        </div>
      </div>

      <div className="ar-dash-grid">
        <ArenaPanel title="Trending fantasy" href="/fantasy" linkLabel="Mercado" compact>
          {trending.map((t) => (
            <Link key={t.playerSlug} href={`/players/${t.playerSlug}`} className="ar-compact-row">
              <TeamLogo slug={t.teamSlug} name={teamName(t.teamSlug)} size={26} />
              <div className="ar-compact-main">
                <div className="ar-compact-title">{t.ign}</div>
                <div className="ar-compact-sub">{t.role} · {t.pickRate}% elegido</div>
              </div>
              <PriceChange change={t.priceChange} />
              <span className="ar-compact-stat" style={{ color: "var(--ar-pick)" }}>{t.price}M</span>
            </Link>
          ))}
        </ArenaPanel>

        <ArenaPanel title="Top gainers" compact>
          {gainers.map((g) => {
            const p = getPlayer(g.playerSlug);
            if (!p?.teamSlug) return null;
            return (
              <Link key={g.playerSlug} href={`/players/${g.playerSlug}`} className="ar-compact-row">
                <TrendingUp size={14} style={{ color: "#5ee89a" }} />
                <div className="ar-compact-main">
                  <div className="ar-compact-title">{p.ign}</div>
                  <div className="ar-compact-sub">{teamName(p.teamSlug)}</div>
                </div>
                <PriceChange change={g.priceChange} />
                <span className="ar-compact-stat">{g.price}M</span>
              </Link>
            );
          })}
        </ArenaPanel>

        <ArenaPanel title="Top losers" compact>
          {losers.map((g) => {
            const p = getPlayer(g.playerSlug);
            if (!p?.teamSlug) return null;
            return (
              <Link key={g.playerSlug} href={`/players/${g.playerSlug}`} className="ar-compact-row">
                <TrendingDown size={14} style={{ color: "var(--ar-live)" }} />
                <div className="ar-compact-main">
                  <div className="ar-compact-title">{p.ign}</div>
                  <div className="ar-compact-sub">{teamName(p.teamSlug)}</div>
                </div>
                <PriceChange change={g.priceChange} />
                <span className="ar-compact-stat">{g.price}M</span>
              </Link>
            );
          })}
        </ArenaPanel>
      </div>

      <div className="ar-dash-grid-2" style={{ marginTop: "var(--ar-gap-lg)" }}>
        <ArenaPanel title="Próximos torneos" href="/tournaments" linkLabel="Calendario" compact>
          {upcomingTournaments.map((t) => (
            <Link key={t.slug} href="/tournaments" className="ar-compact-row">
              <div className="ar-compact-main">
                <div className="ar-compact-title">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
                <div className="ar-compact-sub">{t.region} · {t.prizePool} · {t.teams} equipos</div>
              </div>
              <ArenaBadge variant={t.status === "live" ? "red" : "blue"}>{t.status === "live" ? "Live" : "Próximo"}</ArenaBadge>
            </Link>
          ))}
        </ArenaPanel>

        <ArenaPanel title="Comunidad" compact>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "var(--ar-line)" }}>
            {[
              { label: "Managers", val: community.activeManagers.toLocaleString() },
              { label: "Fichajes hoy", val: community.transfersToday.toLocaleString() },
              { label: "Votos abiertos", val: String(community.openVotes) },
              { label: "Avg aciertos", val: `${community.avgAccuracy}%` },
            ].map((s) => (
              <div key={s.label} style={{ padding: "12px 14px", background: "var(--ar-bg-2)" }}>
                <strong style={{ fontFamily: "var(--ar-head)", fontSize: 18, display: "block" }}>{s.val}</strong>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ar-dim)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </ArenaPanel>
      </div>
    </>
  );
}
