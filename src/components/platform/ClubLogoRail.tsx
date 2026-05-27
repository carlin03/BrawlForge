"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { EsportsTeam } from "@/lib/data/teams";

const RAIL_LIMIT = 28;
/** ~5s por logo visible — scroll muy pausado, estilo broadcast */
const SECONDS_PER_TILE = 5;

export function ClubLogoRail({ teams }: { teams: EsportsTeam[] }) {
  const railTeams = useMemo(() => teams.slice(0, RAIL_LIMIT), [teams]);
  const durationSec = Math.max(90, railTeams.length * SECONDS_PER_TILE);

  if (railTeams.length === 0) return null;

  const loop = [...railTeams, ...railTeams];

  return (
    <div className="bf-arena-club-rail" aria-label="Clubes del circuito">
      <div className="bf-arena-club-rail-edge bf-arena-club-rail-edge--left" aria-hidden />
      <div className="bf-arena-club-rail-edge bf-arena-club-rail-edge--right" aria-hidden />
      <div
        className="bf-arena-club-rail-track"
        style={{ ["--rail-duration" as string]: `${durationSec}s` }}
      >
        {loop.map((t, i) => (
          <Link
            key={`${t.slug}-${i}`}
            href={`/teams/${t.slug}`}
            className="bf-arena-club-tile"
            title={t.name}
          >
            <span className="bf-arena-club-tile-logo">
              <TeamLogo slug={t.slug} name={t.name} size={52} glow={false} />
            </span>
            <span className="bf-arena-club-tile-tag">{t.tag}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
