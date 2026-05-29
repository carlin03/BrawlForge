"use client";

import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import type { RosterPlayerStats } from "@/lib/data/entity-stats";
import { teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { FormDots, SparkBars } from "@/components/platform/ui";
import { MatchCountdown } from "@/components/platform/MatchCountdown";
import { getPlayerPrice, DEFAULT_FANTASY_TOURNAMENT } from "@/lib/data/fantasy";
import { estimateMvpCount } from "@/lib/data/team-page-stats";

export function MetricCell({
  label,
  value,
  sub,
  highlight,
  barPct,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  highlight?: boolean;
  barPct?: number;
}) {
  return (
    <div className={`bf-metric-cell ${highlight ? "is-highlight" : ""}`}>
      <span className="bf-metric-label">{label}</span>
      <strong className="bf-metric-value">{value}</strong>
      {sub && <span className="bf-metric-sub">{sub}</span>}
      {barPct != null && (
        <div className="bf-metric-bar">
          <div className="bf-metric-bar-fill" style={{ width: `${Math.min(100, barPct)}%` }} />
        </div>
      )}
    </div>
  );
}

export function MetricsGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 3 | 4 | 6 }) {
  return <div className={`bf-metrics-grid cols-${cols}`}>{children}</div>;
}

export function WinRateVisual({ wins, losses, pct }: { wins: number; losses: number; pct: number }) {
  const total = wins + losses || 1;
  const wPct = Math.round((wins / total) * 100);
  return (
    <div className="bf-win-visual">
      <div className="bf-win-visual-head">
        <strong>{pct}%</strong>
        <span>
          {wins}V · {losses}D
        </span>
      </div>
      <div className="bf-win-visual-bar">
        <div className="bf-win-visual-w" style={{ width: `${wPct}%` }} />
        <div className="bf-win-visual-l" style={{ width: `${100 - wPct}%` }} />
      </div>
    </div>
  );
}

export function FormStrip({ form, label = "Forma" }: { form: ("W" | "L")[]; label?: string }) {
  if (!form.length) return null;
  return (
    <div className="bf-form-strip">
      <span className="bf-form-strip-label">{label}</span>
      <div className="bf-form-strip-dots">
        {form.map((f, i) => (
          <span key={i} className={`bf-form-strip-dot ${f === "W" ? "is-w" : "is-l"}`} title={f === "W" ? "Victoria" : "Derrota"} />
        ))}
      </div>
    </div>
  );
}

export function CompactMatchCard({
  match,
  perspectiveTeam,
}: {
  match: EsportsMatch;
  perspectiveTeam?: string;
}) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const opp = perspectiveTeam
    ? match.teamASlug === perspectiveTeam
      ? match.teamBSlug
      : match.teamASlug
    : match.teamBSlug;
  const won = perspectiveTeam && finished ? (match.teamASlug === perspectiveTeam ? match.scoreA > match.scoreB : match.scoreB > match.scoreA) : false;
  const lost = perspectiveTeam && finished && !won && match.scoreA !== match.scoreB;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`bf-compact-match ${live ? "is-live" : ""} ${won ? "is-win" : ""} ${lost ? "is-loss" : ""}`}
    >
      <div className="bf-compact-match-top">
        <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={22} />
        <span className="bf-compact-match-meta">{match.stage}</span>
        {live && <span className="bp-chip bp-chip-live">LIVE</span>}
        {finished && perspectiveTeam && (
          <span className={`bf-compact-match-result ${won ? "is-w" : "is-l"}`}>
            {won ? "V" : "D"}
          </span>
        )}
      </div>
      <div className="bf-compact-match-teams">
        <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={28} />
        {finished ? (
          <span className="bf-compact-match-score">
            {match.scoreA} – {match.scoreB}
          </span>
        ) : (
          <span className="bf-compact-match-vs">vs</span>
        )}
        <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={28} />
      </div>
      {!finished && match.status === "upcoming" && (
        <MatchCountdown dateStr={match.date} className="bf-compact-match-time" prefix="" />
      )}
      {perspectiveTeam && (
        <span className="bf-compact-match-opp">vs {teamName(opp)}</span>
      )}
    </Link>
  );
}

export function MatchResultsStrip({
  matches,
  perspectiveTeam,
  title = "Últimos resultados",
}: {
  matches: EsportsMatch[];
  perspectiveTeam: string;
  title?: string;
}) {
  if (!matches.length) return null;
  return (
    <section className="bf-dense-block">
      <h3 className="bf-dense-block-title">{title}</h3>
      <div className="bf-match-results-strip">
        {matches.slice(0, 6).map((m) => (
          <CompactMatchCard key={m.id} match={m} perspectiveTeam={perspectiveTeam} />
        ))}
      </div>
    </section>
  );
}

export function TeamStatsDashboard({
  globalRank,
  regionalRank,
  totalInRegion,
  winRate,
  wins,
  losses,
  trophies,
  earningsK,
  tournaments,
  matchesTotal,
  avgRating,
  avgOvr,
}: {
  globalRank: number | null;
  regionalRank: number | null;
  totalInRegion: number;
  winRate: number;
  wins: number;
  losses: number;
  trophies: number;
  earningsK: number;
  tournaments: number;
  matchesTotal: number;
  avgRating: string;
  avgOvr: number;
}) {
  const barData = [
    { label: "WR", pct: winRate },
    { label: "V", pct: wins },
    { label: "D", pct: losses },
    { label: "T", pct: Math.min(100, trophies * 12) },
  ];

  return (
    <section className="bf-stats-dashboard">
      <h3 className="bf-dense-block-title">Estadísticas del equipo</h3>
      <div className="bf-stats-dashboard-grid">
        <div className="bf-stats-dashboard-main">
          <MetricsGrid cols={4}>
            <MetricCell label="Ranking global" value={globalRank ? `#${globalRank}` : "—"} highlight />
            <MetricCell
              label="Ranking regional"
              value={regionalRank ? `#${regionalRank}` : "—"}
              sub={totalInRegion ? `de ${totalInRegion} en región` : undefined}
            />
            <MetricCell label="Títulos" value={trophies} highlight={trophies > 0} />
            <MetricCell label="Premios" value={`$${earningsK}K`} />
            <MetricCell label="Partidos" value={matchesTotal} />
            <MetricCell label="Victorias" value={wins} barPct={winRate} />
            <MetricCell label="Derrotas" value={losses} />
            <MetricCell label="Torneos" value={tournaments} />
            <MetricCell label="Rating medio" value={avgRating} />
            <MetricCell label="OVR plantilla" value={avgOvr} />
          </MetricsGrid>
        </div>
        <div className="bf-stats-dashboard-side">
          <WinRateVisual wins={wins} losses={losses} pct={winRate} />
          <div className="bf-stats-spark-wrap">
            <span className="bf-metric-label">Distribución</span>
            <SparkBars data={barData} max={100} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlayerStatsDashboard({
  stats,
  rating,
  peakRating,
  fantasyPoints,
  price,
  role,
}: {
  stats: {
    winRate: number;
    wins: number;
    losses: number;
    matchesPlayed: number;
    mvpRate: number;
    tournamentsPlayed: number;
    bestAchievement: string | null;
    form: ("W" | "L")[];
    rosterRank: number | null;
    rosterSize: number;
    marketTier: string;
  };
  rating: number;
  peakRating: number;
  fantasyPoints: number;
  price: number;
  role: string;
}) {
  const bars = [
    { label: "WR", pct: stats.winRate },
    { label: "MVP", pct: stats.mvpRate },
    { label: "OVR", pct: Math.min(100, fantasyPoints) },
    { label: "RTG", pct: Math.min(100, Math.round(rating * 50)) },
  ];

  return (
    <section className="bf-stats-dashboard">
      <h3 className="bf-dense-block-title">Estadísticas competitivas</h3>
      <div className="bf-stats-dashboard-grid">
        <div className="bf-stats-dashboard-main">
          <MetricsGrid cols={4}>
            <MetricCell label="Rating" value={rating.toFixed(2)} highlight barPct={Math.min(100, rating * 50)} />
            <MetricCell label="Rating pico" value={peakRating.toFixed(2)} />
            <MetricCell label="OVR fantasy" value={fantasyPoints} highlight />
            <MetricCell label="Valor mercado" value={`${price.toFixed(1)}M`} />
            <MetricCell label="Win rate" value={`${stats.winRate}%`} barPct={stats.winRate} />
            <MetricCell label="Partidos (club)" value={stats.matchesPlayed} />
            <MetricCell label="Victorias" value={stats.wins} />
            <MetricCell label="Derrotas" value={stats.losses} />
            <MetricCell label="MVP rate" value={`${stats.mvpRate}%`} sub="forma + rendimiento" />
            <MetricCell label="Torneos" value={stats.tournamentsPlayed} />
            <MetricCell label="Rol fantasy" value={role} />
            <MetricCell
              label="En el roster"
              value={stats.rosterRank ? `#${stats.rosterRank}` : "—"}
              sub={stats.rosterSize ? `de ${stats.rosterSize}` : undefined}
            />
            <MetricCell label="Tier" value={stats.marketTier} />
            <MetricCell label="Mejor resultado" value={stats.bestAchievement ?? "—"} />
          </MetricsGrid>
        </div>
        <div className="bf-stats-dashboard-side">
          <WinRateVisual wins={stats.wins} losses={stats.losses} pct={stats.winRate} />
          <FormStrip form={stats.form} />
          <div className="bf-stats-spark-wrap">
            <SparkBars data={bars} max={100} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function RosterDataTable({
  rows,
  teamSlug,
  showPrice,
}: {
  rows: RosterPlayerStats[];
  teamSlug: string;
  showPrice?: boolean;
}) {
  if (!rows.length) return <p className="bf-home-empty">Sin jugadores en plantilla.</p>;

  return (
    <div className="bf-roster-table-wrap">
      <table className="bf-roster-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Jugador</th>
            <th>Rol</th>
            <th>Rating</th>
            <th>OVR</th>
            <th>WR</th>
            <th>Partidos</th>
            <th>Forma</th>
            {showPrice && <th>Valor</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug} className={r.star ? "is-star" : ""}>
              <td className="bf-roster-rank">{r.rosterRank}</td>
              <td>
                <Link href={`/players/${r.slug}`} className="bf-roster-player-cell">
                  <PlayerPhoto playerSlug={r.slug} teamSlug={teamSlug} size={40} />
                  <span>
                    <strong>{r.ign}</strong>
                    <span className="bf-roster-player-meta">
                      {r.country && <CountryFlag country={r.country} size={14} />}
                      {r.isCaptain && <span className="bp-chip bp-chip-red">CAP</span>}
                      {r.star && <span className="bp-chip bp-chip-gold">★</span>}
                    </span>
                  </span>
                </Link>
              </td>
              <td>{r.role}</td>
              <td className="bf-roster-num">{r.rating.toFixed(2)}</td>
              <td className="bf-roster-num is-gold">{r.fantasyPoints}</td>
              <td className="bf-roster-num">{r.winRate}%</td>
              <td className="bf-roster-num">{r.matchesPlayed}</td>
              <td className="bf-roster-num">{estimateMvpCount(r)}</td>
              <td>
                {r.form.length > 0 ? (
                  <span className="bf-roster-mini-form">
                    {r.form.slice(0, 5).map((f, i) => (
                      <span key={i} className={f === "W" ? "w" : "l"} />
                    ))}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              {showPrice && (
                <td className="bf-roster-num">{getPlayerPrice(r.slug, DEFAULT_FANTASY_TOURNAMENT).toFixed(1)}M</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SponsorsRow({ sponsors }: { sponsors: string[] }) {
  if (!sponsors?.length) return null;
  return (
    <section className="bf-dense-block bf-sponsors-row">
      <h3 className="bf-dense-block-title">Patrocinadores</h3>
      <div className="bf-sponsors-chips">
        {sponsors.map((s) => (
          <span key={s} className="bf-sponsor-chip">
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

export function DenseInfoRow({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="bf-dense-info-row">
      {items.map((item) => (
        <div key={item.label} className="bf-dense-info-item">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
