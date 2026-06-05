"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Search, Swords, Trophy, Users } from "lucide-react";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { SectionTabsBar } from "@/components/platform/SectionTabsBar";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import type { Region } from "@/lib/types";
import {
  buildEsportAnalytics,
  filterEsportTeamsByRegion,
  sortEsportTeams,
  type EsportSortKey,
  type TeamEsportStats,
} from "@/lib/data/esport-analytics";
import { buildPublicCalendarPool } from "@/lib/data/match-schedule-trust";
import { getMatchPool } from "@/lib/data/match-pool";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { useOptionalCmsRuntime } from "@/contexts/CmsRuntimeContext";

const REGIONS: (Region | "all")[] = ["all", "EMEA", "NA", "SA", "EA"];

function LeaderboardCard({
  title,
  rows,
  metric,
  tone = "neutral",
}: {
  title: string;
  rows: TeamEsportStats[];
  metric: "winRate" | "wins" | "matches";
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <section className={`bf-esport-lb bf-esport-lb--${tone}`}>
      <h3>{title}</h3>
      <ul>
        {rows.length === 0 ? (
          <li className="bf-esport-lb-empty">Sin datos suficientes</li>
        ) : (
          rows.map((t) => (
            <li key={t.slug}>
              <Link href={`/teams/${t.slug}`} className="bf-esport-lb-row">
                <TeamLogo slug={t.slug} name={t.name} tag={t.tag} size={32} glow={false} />
                <div className="bf-esport-lb-text">
                  <strong>{t.name}</strong>
                  <span>
                    {t.wins}W – {t.losses}L · <RegionBadge region={t.region} />
                  </span>
                </div>
                <b className="bf-esport-lb-metric">
                  {metric === "winRate" ? `${t.winRate}%` : metric === "wins" ? `${t.wins}W` : t.matches}
                </b>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function EsportView() {
  const cms = useOptionalCmsRuntime();
  const overview = useMemo(() => {
    const base = cms?.matchPool ?? getMatchPool();
    return buildEsportAnalytics(buildPublicCalendarPool(base));
  }, [cms?.matchPool]);

  const [region, setRegion] = useState<Region | "all">("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<EsportSortKey>("matches");

  const filtered = useMemo(() => {
    let list = filterEsportTeamsByRegion(overview.teams, region);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.tag.toLowerCase().includes(q) ||
          t.slug.includes(q),
      );
    }
    return sortEsportTeams(list, sortKey, true);
  }, [overview.teams, region, query, sortKey]);

  const scopedLeaderboards = useMemo(() => {
    const scoped = filterEsportTeamsByRegion(overview.teams, region);
    const wrEligible = scoped.filter((t) => t.matches >= 3);
    const byWr = [...wrEligible].sort((a, b) => b.winRate - a.winRate || b.matches - a.matches);
    const byWorst = [...wrEligible].sort((a, b) => a.winRate - b.winRate || b.matches - a.matches);
    const byWins = [...scoped].sort((a, b) => b.wins - a.wins);
    const byMatches = [...scoped].sort((a, b) => b.matches - a.matches);
    return {
      topWinRate: byWr.slice(0, 5),
      worstWinRate: byWorst.slice(0, 5),
      mostWins: byWins.slice(0, 5),
      mostMatches: byMatches.slice(0, 5),
    };
  }, [overview.teams, region]);

  return (
    <PageUltraShell className="bf-esport-page">
      <header className="bf-esport-hero">
        <p className="bf-esport-kicker">
          <BarChart3 size={14} aria-hidden /> Datos reales · BSC 2026 · Liquipedia
        </p>
        <h1>
          Esports <em>stats</em>
        </h1>
        <p className="bf-esport-lead">
          Win rate, victorias y actividad calculados desde partidos oficiales confirmados — sin datos inventados.
        </p>

        <div className="bf-esport-stats">
          <div className="bf-esport-stat">
            <Users size={18} aria-hidden />
            <b>{overview.teamCount}</b>
            <span>Equipos</span>
          </div>
          <div className="bf-esport-stat">
            <Swords size={18} aria-hidden />
            <b>{overview.playerCount}</b>
            <span>Jugadores</span>
          </div>
          <div className="bf-esport-stat">
            <Trophy size={18} aria-hidden />
            <b>{overview.matchCount}</b>
            <span>Partidos</span>
          </div>
          <div className="bf-esport-stat">
            <BarChart3 size={18} aria-hidden />
            <b>{overview.matchesWithMeta}</b>
            <span>Con meta</span>
          </div>
        </div>

        <div className="bf-esport-hero-actions">
          <Link href="/matches" className="fu-btn fu-btn-ghost">
            Calendario
          </Link>
          <Link href="/teams" className="fu-btn fu-btn-red">
            Clubes
          </Link>
        </div>
      </header>

      <SectionTabsBar entityLogo={<TournamentLogo slug="bsc-2026-brawl-cup" name="BSC 2026" size={44} glow />}>
        <div className="bf-home-tabs">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`bf-home-tab ${region === r ? "is-on" : ""}`}
              onClick={() => setRegion(r)}
            >
              {r === "all" ? "Global" : r}
            </button>
          ))}
        </div>
      </SectionTabsBar>

      <div className="bf-esport-lb-grid">
        <LeaderboardCard title="Top win rate" rows={scopedLeaderboards.topWinRate} metric="winRate" tone="good" />
        <LeaderboardCard title="Peor win rate" rows={scopedLeaderboards.worstWinRate} metric="winRate" tone="bad" />
        <LeaderboardCard title="Más victorias" rows={scopedLeaderboards.mostWins} metric="wins" />
        <LeaderboardCard title="Más partidos" rows={scopedLeaderboards.mostMatches} metric="matches" />
      </div>

      {(overview.topBrawlers.length > 0 || overview.topMaps.length > 0) && (
        <div className="bf-esport-meta-grid">
          {overview.topBrawlers.length > 0 && (
            <section className="bf-esport-meta-panel">
              <h2>Brawlers más jugados</h2>
              <p className="bf-esport-meta-lead">
                Picks y MVP agregados de {overview.matchesWithMeta} partidos con estadísticas.
              </p>
              <ul className="bf-esport-brawler-list">
                {overview.topBrawlers.map((b) => (
                  <li key={b.name}>
                    <BrawlerAssetIcon name={b.name} size={48} variant="meta" />
                    <div>
                      <strong>{b.name}</strong>
                      <span>
                        {b.picks} picks · {b.bans} bans
                        {b.mvpMentions > 0 ? ` · ${b.mvpMentions} MVP` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {overview.topMaps.length > 0 && (
            <section className="bf-esport-meta-panel">
              <h2>Mapas más jugados</h2>
              <p className="bf-esport-meta-lead">Frecuencia en series finalizadas del circuito BSC.</p>
              <ul className="bf-esport-map-list">
                {overview.topMaps.map((m) => (
                  <li key={m.name}>
                    <strong>{m.name}</strong>
                    <span>{m.plays} mapas</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section className="bf-esport-table-section" aria-labelledby="esport-teams-title">
        <div className="bf-esport-table-head">
          <h2 id="esport-teams-title">Todos los equipos</h2>
          <div className="bf-esport-table-tools">
            <label className="bf-esport-search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder="Buscar equipo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="bf-esport-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as EsportSortKey)}
              aria-label="Ordenar por"
            >
              <option value="matches">Partidos</option>
              <option value="winRate">Win rate</option>
              <option value="wins">Victorias</option>
            </select>
          </div>
        </div>

        <div className="bf-esport-table-wrap">
          <table className="bf-esport-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Equipo</th>
                <th>Región</th>
                <th>W – L</th>
                <th>Partidos</th>
                <th>WR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="bf-esport-empty">
                    Sin equipos con partidos en esta región.
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr key={t.slug}>
                    <td>{i + 1}</td>
                    <td>
                      <Link href={`/teams/${t.slug}`} className="bf-esport-team-cell">
                        <TeamLogo slug={t.slug} name={t.name} tag={t.tag} size={28} glow={false} />
                        <span>{t.name}</span>
                      </Link>
                    </td>
                    <td>
                      <RegionBadge region={t.region} />
                    </td>
                    <td>
                      {t.wins} – {t.losses}
                    </td>
                    <td>{t.matches}</td>
                    <td>
                      <span className={t.winRate >= 50 ? "is-good" : "is-muted"}>{t.winRate}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageUltraShell>
  );
}
