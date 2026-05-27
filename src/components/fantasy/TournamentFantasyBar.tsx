"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { getTournamentFantasyProfile } from "@/lib/data/fantasy";
import { tournamentStatusLabel } from "@/lib/i18n";

interface TournamentFantasyBarProps {
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function TournamentFantasyBar({ activeSlug, onSelect }: TournamentFantasyBarProps) {
  const tournaments = getFantasyTournaments(false);
  const profile = getTournamentFantasyProfile(activeSlug);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      if (profile.isLocked) {
        setRemaining("Cerrado");
        return;
      }
      const diff = new Date(profile.deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Cerrado");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [profile.deadline, profile.isLocked]);

  return (
    <div className="bc-deadline">
      <div className="bc-deadline-clock">
        <span className="bc-deadline-label">Cierre</span>
        <span className={`bc-deadline-time ${profile.isLocked ? "is-closed" : ""}`}>{remaining}</span>
      </div>
      <div className="bc-event-list">
        {tournaments.map(({ slug, tournament, teamCount }) => {
          const p = getTournamentFantasyProfile(slug);
          const isActive = slug === activeSlug;
          return (
            <button
              key={slug}
              type="button"
              className={`bc-event-item ${isActive ? "is-active" : ""}`}
              onClick={() => onSelect(slug)}
            >
              <TournamentLogo slug={slug} name={tournament.shortName} size={24} />
              <span className="bc-event-name">{tournament.shortName}</span>
              <span className="bc-event-status">
                {teamCount} equipos · {tournament.status === "live" && <span className="nv-live-dot" style={{ marginRight: 4 }} />}
                {tournamentStatusLabel(tournament.status)}
              </span>
              {p.rank > 0 && <span className="bc-event-rank nv-mono">#{p.rank.toLocaleString()}</span>}
            </button>
          );
        })}
      </div>
      <Link href={`/tournaments/${activeSlug}`} className="bc-deadline-link">
        Evento →
      </Link>
    </div>
  );
}
