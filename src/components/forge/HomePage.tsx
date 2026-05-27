"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Block, MatchRow, StatStrip, Chip, PriceDelta } from "./ui";
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
  getLiveActivity,
  getUpcomingTournamentsWidget,
  getTopPredictors,
  DEFAULT_FANTASY_TOURNAMENT,
  getUserSquad,
  getTournamentFantasyProfile,
  getSquadValue,
  FANTASY_BUDGET,
  getPlayerPrice,
  getTournamentLeaderboard,
  tournamentName,
  getFantasyRole,
} from "@/lib/data";

export function ForgeHome() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "upcoming");
  const matches = useMemo(() => getCuratedHomeMatches(tab, 10), [tab]);

  const squad = getUserSquad(DEFAULT_FANTASY_TOURNAMENT);
  const fantasy = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const squadVal = getSquadValue(squad, DEFAULT_FANTASY_TOURNAMENT);
  const vote = openPredictions.find((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug));
  const activity = getLiveActivity(8);
  const trending = getTrendingPlayers(4);
  const gainers = getTopGainers(3);
  const transfers = getRecentTransfers(4);
  const tournaments = getUpcomingTournamentsWidget(3);
  const leaders = getTournamentLeaderboard(DEFAULT_FANTASY_TOURNAMENT).slice(0, 4);
  const predictors = getTopPredictors(4);

  return (
    <>
      {live.length > 0 && (
        <div className="fg-live-bar">
          {live.map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="fg-live-pill is-live">
              <span className="fg-dot-live" />
              {teamName(m.teamASlug)} {m.scoreA}–{m.scoreB} {teamName(m.teamBSlug)}
            </Link>
          ))}
        </div>
      )}

      <StatStrip
        items={[
          { label: "Pts fantasy", value: String(fantasy.totalPoints), accent: "var(--fg-gold)" },
          { label: "Predicciones", value: String(userPredictorProfile.totalPoints) },
          { label: "Racha", value: String(userPredictorProfile.streak), accent: "var(--fg-blue-bright)" },
          { label: "En directo", value: String(live.length), accent: live.length ? "var(--fg-red)" : undefined },
        ]}
      />

      <div className="fg-home-main">
        <div>
          <Block
            title="Partidos"
            href="/matches"
            action={
              <div style={{ display: "flex", gap: 4 }}>
                {(["live", "upcoming", "results"] as const).map((t) => (
                  <button key={t} type="button" className={`fg-filter ${tab === t ? "is-on" : ""}`} onClick={() => setTab(t)}>
                    {t === "live" ? "Live" : t === "upcoming" ? "Próx." : "Res."}
                  </button>
                ))}
              </div>
            }
          >
            {matches.length ? matches.map((m) => <MatchRow key={m.id} match={m} />) : (
              <div className="fg-empty">Sin partidos en esta vista.</div>
            )}
          </Block>

          <div style={{ marginTop: "var(--fg-gap-lg)" }}>
            <Block title="Actividad">
              {activity.map((a) => (
                <div key={a.id} className="fg-row" style={{ cursor: "default" }}>
                  <div className="fg-row-main">
                    <div className="fg-row-title">{a.text}</div>
                  </div>
                  <span className="fg-row-sub">{a.ago}</span>
                </div>
              ))}
            </Block>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--fg-gap-lg)" }}>
          <Block title="Tu fantasy" href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}>
            <div className="fg-row" style={{ borderBottom: "1px solid var(--fg-line)", cursor: "default" }}>
              <div className="fg-row-main">
                <Chip variant="gold">{tournamentName(DEFAULT_FANTASY_TOURNAMENT)}</Chip>
                <div className="fg-row-sub" style={{ marginTop: 6 }}>
                  {fantasy.totalPoints} pts · #{fantasy.rank.toLocaleString()} · ${squadVal}M / ${FANTASY_BUDGET}M
                </div>
              </div>
            </div>
            {squad.map((slot) => {
              const p = getPlayer(slot.playerSlug);
              if (!p?.teamSlug) return null;
              return (
                <Link key={slot.playerSlug} href={`/players/${slot.playerSlug}`} className="fg-row">
                  <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={24} />
                  <div className="fg-row-main">
                    <div className="fg-row-title">{p.ign}{slot.isCaptain && " · C"}</div>
                    <div className="fg-row-sub">{getFantasyRole(p.slug)}</div>
                  </div>
                  <span className="fg-row-stat" style={{ color: "var(--fg-gold)" }}>{getPlayerPrice(p.slug, DEFAULT_FANTASY_TOURNAMENT)}M</span>
                </Link>
              );
            })}
          </Block>

          {vote && (
            <Block title="Vota ahora" href="/predictions">
              <div className="fg-poll">
                <div className="fg-row-sub">{getPredictionTournament(vote)} · +{vote.rewardPoints} pts</div>
                <div className="fg-poll-options">
                  <div className="fg-poll-opt">
                    <TeamLogo slug={vote.teamASlug} name={teamName(vote.teamASlug)} size={32} />
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{getPredictionLabel(vote, "A")}</span>
                  </div>
                  <div className="fg-poll-opt">
                    <TeamLogo slug={vote.teamBSlug} name={teamName(vote.teamBSlug)} size={32} />
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{getPredictionLabel(vote, "B")}</span>
                  </div>
                </div>
                <div className="fg-poll-bar">
                  <div className="fg-poll-bar-a" style={{ width: `${vote.pickAPct}%` }} />
                  <div className="fg-poll-bar-b" style={{ width: `${vote.pickBPct}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-dim)", marginTop: 6 }}>
                  <span>{vote.pickAPct}%</span><span>{vote.pickBPct}%</span>
                </div>
              </div>
            </Block>
          )}

          <Block title="Fichajes recientes" href="/fantasy">
            {transfers.map((t) => {
              const p = getPlayer(t.playerSlug);
              if (!p?.teamSlug) return null;
              return (
                <Link key={t.playerSlug + t.ago} href={`/players/${t.playerSlug}`} className="fg-row">
                  <div className="fg-row-main">
                    <div className="fg-row-title">{p.ign}</div>
                    <div className="fg-row-sub">{t.type === "in" ? "Entrada" : "Salida"} · {t.ago}</div>
                  </div>
                  <span className="fg-row-stat">{t.price}M</span>
                </Link>
              );
            })}
          </Block>
        </div>
      </div>

      <div className="fg-home-bottom">
        <Block title="Trending fantasy" href="/fantasy">
          {trending.map((t) => (
            <Link key={t.playerSlug} href={`/players/${t.playerSlug}`} className="fg-row">
              <TeamLogo slug={t.teamSlug} name={teamName(t.teamSlug)} size={22} />
              <div className="fg-row-main">
                <div className="fg-row-title">{t.ign}</div>
                <div className="fg-row-sub">{t.pickRate}% elegido</div>
              </div>
              <PriceDelta change={t.priceChange} />
              <span className="fg-row-stat">{t.price}M</span>
            </Link>
          ))}
        </Block>

        <Block title="Subiendo precio">
          {gainers.map((g) => {
            const p = getPlayer(g.playerSlug);
            if (!p) return null;
            return (
              <Link key={g.playerSlug} href={`/players/${g.playerSlug}`} className="fg-row">
                <div className="fg-row-main">
                  <div className="fg-row-title">{p.ign}</div>
                </div>
                <PriceDelta change={g.priceChange} />
              </Link>
            );
          })}
        </Block>

        <Block title="Torneos activos" href="/matches">
          {tournaments.map((t) => (
            <div key={t.slug} className="fg-row" style={{ cursor: "default" }}>
              <div className="fg-row-main">
                <div className="fg-row-title">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
                <div className="fg-row-sub">{t.region} · {t.prizePool}</div>
              </div>
              <Chip variant={t.status === "live" ? "live" : "blue"}>{t.status === "live" ? "Live" : "Próximo"}</Chip>
            </div>
          ))}
        </Block>
      </div>

      <div className="fg-home-bottom" style={{ marginTop: "var(--fg-gap-lg)" }}>
        <Block title="Líderes fantasy">
          {leaders.map((e) => (
            <div key={e.rank} className="fg-row" style={{ cursor: "default" }}>
              <span className="fg-rank top">{e.rank}</span>
              <div className="fg-row-main">
                <div className="fg-row-title">{e.username}</div>
                <div className="fg-row-sub">Cap: {e.captainIgn}</div>
              </div>
              <span className="fg-row-stat" style={{ color: "var(--fg-gold)" }}>{e.points}</span>
            </div>
          ))}
        </Block>
        <Block title="Top predictors" href="/predictions">
          {predictors.map((p, i) => (
            <div key={p.username} className="fg-row" style={{ cursor: "default" }}>
              <span className="fg-rank">{i + 1}</span>
              <div className="fg-row-main">
                <div className="fg-row-title">{p.username}</div>
                <div className="fg-row-sub">{p.accuracy}% · racha {p.streak}</div>
              </div>
              <span className="fg-row-stat">{p.points}</span>
            </div>
          ))}
        </Block>
        <Block title="Mercado" href="/fantasy">
          {getTopLosers(4).map((g) => {
            const p = getPlayer(g.playerSlug);
            if (!p) return null;
            return (
              <Link key={g.playerSlug} href={`/players/${g.playerSlug}`} className="fg-row">
                <div className="fg-row-main">
                  <div className="fg-row-title">{p.ign}</div>
                </div>
                <PriceDelta change={g.priceChange} />
                <span className="fg-row-stat">{g.price}M</span>
              </Link>
            );
          })}
        </Block>
      </div>
    </>
  );
}
