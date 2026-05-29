"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Share2,
  Video,
  Globe,
} from "lucide-react";
import { RosterDataTable } from "@/components/platform/EntityPremiumUI";
import { ProfileSectionHeader } from "@/components/platform/EntityProfileLayout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import { getFantasyRole } from "@/lib/data/fantasy-meta";
import type { RosterPlayerStats } from "@/lib/data/entity-stats";
import type { TeamTournamentRow } from "@/lib/data/team-detail";
import {
  TOUR_FILTER_OPTIONS,
  filterTournamentHistory,
  estimateMvpCount,
  type TeamAdvancedStats,
  hasMeaningfulOrgContent,
  type TeamOrgInfo,
  type TeamSponsorEntry,
  type TourFilterId,
} from "@/lib/data/team-page-stats";
import { SparkBars } from "@/components/platform/ui";
import { MetricsGrid, MetricCell, WinRateVisual } from "@/components/platform/EntityPremiumUI";
import type { SocialLinks } from "@/lib/data/profile-wiki";

export type RosterViewMode = "cards" | "table";

export function RosterViewSwitch({
  mode,
  onChange,
}: {
  mode: RosterViewMode;
  onChange: (m: RosterViewMode) => void;
}) {
  return (
    <div className="bf-roster-view-switch" role="group" aria-label="Vista de plantilla">
      <button
        type="button"
        className={mode === "cards" ? "is-on" : ""}
        onClick={() => onChange("cards")}
      >
        Cards
      </button>
      <button
        type="button"
        className={mode === "table" ? "is-on" : ""}
        onClick={() => onChange("table")}
      >
        Tabla
      </button>
    </div>
  );
}

function RosterStatCard({ row, teamSlug }: { row: RosterPlayerStats; teamSlug: string }) {
  const mvps = estimateMvpCount(row);
  const role = getFantasyRole(row.slug);

  return (
    <Link href={`/players/${row.slug}`} className={`bf-roster-stat-card ${row.star ? "is-star" : ""}`}>
      <div className="bf-roster-stat-card-photo">
        <PlayerPhoto playerSlug={row.slug} teamSlug={teamSlug} size={48} />
        {row.country && (
          <span className="bf-roster-stat-card-flag">
            <CountryFlag country={row.country} size={16} />
          </span>
        )}
      </div>
      <div className="bf-roster-stat-card-name">
        <strong>{row.ign}</strong>
        {(row.isCaptain || row.star) && (
          <span className="bf-roster-stat-card-badges">
            {row.isCaptain && <span className="bp-chip bp-chip-red">CAP</span>}
            {row.star && <span className="bp-chip bp-chip-gold">★</span>}
          </span>
        )}
      </div>
      <div className="bf-roster-stat-card-metrics">
        <span><em>Rating</em><b>{row.rating.toFixed(2)}</b></span>
        <span><em>OVR</em><b className="is-gold">{row.fantasyPoints}</b></span>
        <span><em>Rol</em><b>{role}</b></span>
        <span><em>WR</em><b>{row.winRate}%</b></span>
        <span><em>MVPs</em><b>{mvps}</b></span>
      </div>
    </Link>
  );
}

export function RosterPanel({
  rows,
  teamSlug,
  defaultMode = "table",
}: {
  rows: RosterPlayerStats[];
  teamSlug: string;
  teamName?: string;
  showPrice?: boolean;
  defaultMode?: RosterViewMode;
}) {
  const [mode, setMode] = useState<RosterViewMode>(defaultMode);

  return (
    <>
      <div className="bf-roster-panel-head">
        <RosterViewSwitch mode={mode} onChange={setMode} />
      </div>
      {mode === "cards" ? (
        <div className="bf-roster-cards-grid">
          {rows.map((r) => (
            <RosterStatCard key={r.slug} row={r} teamSlug={teamSlug} />
          ))}
        </div>
      ) : (
        <RosterDataTable rows={rows} teamSlug={teamSlug} showPrice={false} />
      )}
    </>
  );
}

/** Bloque lateral de organización; solo si hay datos más allá del infobox */
export function TeamOrganizationBlock({ org }: { org: TeamOrgInfo }) {
  if (!hasMeaningfulOrgContent(org)) return null;

  const rows: { label: string; value: React.ReactNode }[] = [];
  if (org.manager) rows.push({ label: "Manager", value: org.manager });
  if (org.ceo) rows.push({ label: "CEO", value: org.ceo });

  return (
    <section className="bf-ep-side-block bf-team-org-block">
      <h3>Organización</h3>
      <dl className="bf-team-org-dl">
        {rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const SOCIAL_VISUAL: {
  key: keyof SocialLinks;
  label: string;
  icon: typeof Globe;
}[] = [
  { key: "twitter", label: "X", icon: MessageCircle },
  { key: "youtube", label: "YouTube", icon: Video },
  { key: "twitch", label: "Twitch", icon: Video },
  { key: "tiktok", label: "TikTok", icon: Share2 },
  { key: "instagram", label: "Instagram", icon: Share2 },
  { key: "discord", label: "Discord", icon: MessageCircle },
];

export function TeamPartnersSection({
  sponsors,
  social,
  teamName,
}: {
  sponsors: TeamSponsorEntry[];
  social: Record<string, string>;
  teamName: string;
}) {
  const socialEntries = SOCIAL_VISUAL.filter((s) => social[s.key]?.trim());
  if (!sponsors.length && !socialEntries.length) return null;

  return (
    <section className="bf-dense-block bf-team-partners">
      {sponsors.length > 0 && (
        <>
          <h3 className="bf-dense-block-title">Patrocinadores</h3>
          <div className="bf-sponsors-visual-grid">
            {sponsors.map((s) => (
              <div key={s.name} className="bf-sponsor-visual-card">
                {s.logo_url ? (
                  <img src={s.logo_url} alt="" className="bf-sponsor-visual-logo" />
                ) : (
                  <span className="bf-sponsor-visual-initials" aria-hidden>
                    {s.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <strong>{s.name}</strong>
                {s.category && <span>{s.category}</span>}
              </div>
            ))}
          </div>
        </>
      )}
      {socialEntries.length > 0 && (
        <>
          <h3 className="bf-dense-block-title" style={{ marginTop: sponsors.length ? 20 : 0 }}>
            Redes · {teamName}
          </h3>
          <p className="bf-team-partners-hint">Presencia en plataformas (sin salir de BrawlForge)</p>
          <div className="bf-social-visual-grid">
            {socialEntries.map(({ key, label, icon: Icon }) => (
              <span key={key} className="bf-social-visual-chip" title={social[key]}>
                <Icon size={20} />
                <span>{label}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

type TourListItem = {
  slug: string;
  name: string;
  shortName: string;
  prizePool: string;
  status: TeamTournamentRow["status"];
  tier?: number;
};

function toTourRow(t: TourListItem): TeamTournamentRow {
  return {
    ...t,
    played: 0,
    wins: 0,
    losses: 0,
  };
}

export function TournamentHistoryFiltered({
  rows,
  registered,
  cleanName,
}: {
  rows: TeamTournamentRow[];
  registered: TourListItem[];
  cleanName: (s: string) => string;
}) {
  const [filter, setFilter] = useState<TourFilterId>("all");
  const filtered = useMemo(() => filterTournamentHistory(rows, filter), [rows, filter]);
  const regRows = useMemo(
    () => registered.filter((t) => !rows.some((h) => h.slug === t.slug)).map(toTourRow),
    [registered, rows],
  );
  const filteredReg = useMemo(() => filterTournamentHistory(regRows, filter), [regRows, filter]);

  return (
    <>
      <div className="bf-tour-filter-bar" role="group" aria-label="Filtrar historial">
        {TOUR_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`bf-tour-filter-chip ${filter === opt.id ? "is-on" : ""}`}
            onClick={() => setFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="bf-team-tour-list">
        {filtered.length === 0 && filteredReg.length === 0 ? (
          <p className="bf-home-empty">Sin torneos en esta categoría.</p>
        ) : (
          <>
            {filtered.map((t) => (
              <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-team-tour-row bf-hover-lift">
                <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={44} />
                <div className="bf-team-tour-info">
                  {t.tier != null && (
                    <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                  )}
                  <strong>{cleanName(t.shortName)}</strong>
                  <span>
                    {t.played} partidos · {t.wins}W {t.losses}L · {t.prizePool}
                  </span>
                </div>
                <span className={`bf-home-tour-status status-${t.status}`}>{t.status}</span>
              </Link>
            ))}
            {filteredReg.map((t) => (
              <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-team-tour-row is-muted bf-hover-lift">
                <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={44} />
                <div className="bf-team-tour-info">
                  <strong>{cleanName(t.shortName)}</strong>
                  <span>Inscrito · {t.prizePool}</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export function TeamAdvancedStatsSection({ stats }: { stats: TeamAdvancedStats }) {
  const seasonBars = stats.winRateBySeason.map((s) => ({ label: s.label, pct: s.winRate }));

  return (
    <section className="bf-dense-block bf-team-advanced-stats">
      <h3 className="bf-dense-block-title">Estadísticas avanzadas</h3>
      <MetricsGrid cols={4}>
        <MetricCell
          label="Racha actual"
          value={`${stats.currentStreak.count}${stats.currentStreak.type}`}
          highlight
        />
        <MetricCell label="Mejor racha (W)" value={stats.bestWinStreak} highlight />
        <MetricCell
          label="Regional"
          value={`${stats.regional.winRate}%`}
          sub={`${stats.regional.wins}W · ${stats.regional.played} partidos`}
          barPct={stats.regional.winRate}
        />
        <MetricCell
          label="Internacional"
          value={`${stats.international.winRate}%`}
          sub={`${stats.international.wins}W · ${stats.international.played} partidos`}
          barPct={stats.international.winRate}
        />
      </MetricsGrid>
      {stats.winRateBySeason.length > 0 && (
        <div className="bf-team-season-block">
          <span className="bf-metric-label">Win rate por temporada</span>
          <div className="bf-team-season-grid">
            {stats.winRateBySeason.map((s) => (
              <div key={s.label} className="bf-team-season-cell">
                <strong>{s.winRate}%</strong>
                <span>{s.label}</span>
                <span className="bf-team-season-sub">{s.played} partidos</span>
              </div>
            ))}
          </div>
          <div className="bf-stats-spark-wrap">
            <SparkBars data={seasonBars} max={100} />
          </div>
        </div>
      )}
      <div className="bf-team-advanced-wr-row">
        <WinRateVisual
          wins={stats.regional.wins}
          losses={stats.regional.losses}
          pct={stats.regional.winRate}
        />
        <WinRateVisual
          wins={stats.international.wins}
          losses={stats.international.losses}
          pct={stats.international.winRate}
        />
      </div>
    </section>
  );
}
