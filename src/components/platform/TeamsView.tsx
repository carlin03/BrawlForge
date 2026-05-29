"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Shield } from "lucide-react";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import type { EsportsTeam } from "@/lib/data/teams";
import type { Region } from "@/lib/types";
import { getPlayersByTeam, getTeamPlatformMeta, teamName } from "@/lib/data";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

const REGIONS: (Region | "all")[] = ["all", "EMEA", "NA", "SA", "EA"];

export function TeamsView({ teams }: { teams: EsportsTeam[] }) {
  const [region, setRegion] = useState<Region | "all">("all");
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => {
    let filtered = region === "all" ? teams : teams.filter((t) => t.region === region);
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.tag.toLowerCase().includes(q) ||
          t.slug.includes(q),
      );
    }
    return [...filtered].sort((a, b) => a.rank - b.rank);
  }, [teams, region, query]);

  const spotlight = query.trim() ? [] : sorted.slice(0, 3);
  const rest = query.trim() ? sorted : sorted.slice(3);

  const topThree = sorted.slice(0, 3);

  return (
    <PageUltraShell className="bf-teams-page">
      <PageUltraHero
        kicker={
          <>
            <Shield size={14} /> Circuito BSC 2026
          </>
        }
        title={
          <>
            Clubes <em>pro</em>
          </>
        }
        lead={`${sorted.length} equipos verificados · busca por nombre, tag o región`}
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="fu-stat">
              <b>{sorted.length}</b>
              <span>En vista</span>
            </div>
            <div className="fu-stat">
              <b>{region === "all" ? "GLOBAL" : region}</b>
              <span>Región</span>
            </div>
            <div className="fu-stat">
              <b>2026</b>
              <span>Temporada</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href="/rankings" className="fu-btn fu-btn-ghost">
              Rankings
            </Link>
            <Link href="/fantasy" className="fu-btn fu-btn-gold">
              Fantasy
            </Link>
            <Link href="/tournaments" className="fu-btn fu-btn-red">
              Torneos
            </Link>
          </>
        }
        showcase={
          topThree.length >= 3 ? (
            <div className="bf-teams-showcase fu-cards-showcase">
              {[topThree[1], topThree[0], topThree[2]].map((t, i) => (
                <Link
                  key={t.slug}
                  href={`/teams/${t.slug}`}
                  className={`bf-teams-showcase-card fu-card-float fu-card-float-${i === 1 ? 2 : i === 0 ? 1 : 3}`}
                >
                  <span className="bf-teams-showcase-rank">#{i === 1 ? 1 : i === 0 ? 2 : 3}</span>
                  <TeamLogo slug={t.slug} name={t.name} size={i === 1 ? 128 : 104} glow />
                  <strong>{t.name}</strong>
                  <span className="bf-teams-showcase-tag">{t.tag}</span>
                </Link>
              ))}
            </div>
          ) : undefined
        }
      />

      <label className="bf-teams-search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          placeholder="Buscar club por nombre, tag o slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>

      {spotlight.length >= 3 && !query.trim() && (
        <div className="bf-teams-podium">
          {[spotlight[1], spotlight[0], spotlight[2]].map((t, i) => (
            <Link
              key={t.slug}
              href={`/teams/${t.slug}`}
              className={`bf-teams-podium-slot ${i === 1 ? "is-champ" : ""}`}
            >
              <div className="bf-teams-podium-glow" aria-hidden />
              <TeamLogo slug={t.slug} name={t.name} size={i === 1 ? 72 : 56} />
              <strong>{t.tag}</strong>
              <span>{t.name}</span>
              <RegionBadge region={t.region} />
              {SHOW_DEMO_SOCIAL && (
                <span className="bf-teams-podium-meta">
                  {getTeamPlatformMeta(t.slug).recentResult ?? "Circuito activo"}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

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

      <div className="bf-teams-grid bf-stagger">
        {rest.map((t) => {
          const meta = getTeamPlatformMeta(t.slug);
          const rosterCount = getPlayersByTeam(t.slug).length;
          return (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="bf-team-card">
              <div className="bf-team-card-glow" aria-hidden />
              <TeamLogo slug={t.slug} name={t.name} size={52} />
              <div className="bf-team-card-body">
                <div className="bf-team-card-head">
                  <strong>{t.tag}</strong>
                  <RegionBadge region={t.region} />
                </div>
                <span className="bf-team-card-name">{t.name}</span>
                <span className="bf-team-card-meta">
                  {rosterCount} jugadores
                  {SHOW_DEMO_SOCIAL && meta.recentResult ? ` · ${meta.recentResult}` : ""}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {sorted.length === 0 && <p className="bf-home-empty fu-panel">No hay equipos en esta región.</p>}
    </PageUltraShell>
  );
}
