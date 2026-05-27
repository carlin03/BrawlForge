"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import type { EsportsTeam } from "@/lib/data/teams";
import type { Region } from "@/lib/types";
import { getPlayersByTeam, getTeamPlatformMeta, getCompetitiveTeamSlugs, teamName } from "@/lib/data";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

const REGIONS: (Region | "all")[] = ["all", "EMEA", "NA", "SA", "EA"];

export function TeamsView({ teams }: { teams: EsportsTeam[] }) {
  const [region, setRegion] = useState<Region | "all">("all");
  const competitive = useMemo(() => new Set(getCompetitiveTeamSlugs()), []);

  const sorted = useMemo(() => {
    const base = teams.filter((t) => competitive.has(t.slug));
    const filtered = region === "all" ? base : base.filter((t) => t.region === region);
    return [...filtered].sort((a, b) => a.rank - b.rank);
  }, [teams, region, competitive]);

  const spotlight = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="bf-teams-page">
      <header className="bf-fantasy-gate">
        <div className="bf-fantasy-gate-left">
          <span className="bf-home-gate-badge">Tier B+</span>
          <div>
            <h1 className="bf-fantasy-title">Clubes</h1>
            <p className="bf-fantasy-sub">{sorted.length} equipos · logos PNG Liquipedia</p>
          </div>
        </div>
        <Link href="/fantasy" className="bp-btn bp-btn-gold">Mercado fantasy</Link>
      </header>

      {spotlight.length >= 3 && (
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

      <div className="bf-teams-grid">
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

      {sorted.length === 0 && <p className="bf-home-empty">No hay equipos en esta región.</p>}
    </div>
  );
}
