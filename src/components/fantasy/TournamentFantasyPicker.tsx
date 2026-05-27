"use client";

import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { getTournamentFantasyProfile, getUserSquad } from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { tournamentStatusLabel } from "@/lib/i18n";

interface TournamentFantasyPickerProps {
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function TournamentFantasyPicker({ activeSlug, onSelect }: TournamentFantasyPickerProps) {
  const tournaments = getFantasyTournaments(true);

  return (
    <section className="fx-tournament-picker">
      <div className="fx-tournament-picker-head">
        <span className="fx-tournament-picker-label">Elige tu torneo</span>
        <span className="text-xs text-[var(--bf-muted)]">Plantilla independiente por evento</span>
      </div>
      <div className="fx-tournament-picker-grid">
        {tournaments.map(({ slug, tournament }) => {
          const profile = getTournamentFantasyProfile(slug);
          const squad = getUserSquad(slug);
          const active = slug === activeSlug;
          const hasSquad = squad.length > 0;

          return (
            <button
              key={slug}
              type="button"
              className={`fx-tournament-card ${active ? "fx-tournament-card-active" : ""} ${hasSquad ? "fx-tournament-card-has-squad" : ""}`}
              onClick={() => onSelect(slug)}
            >
              <div className="fx-tournament-card-glow" />
              <div className="fx-tournament-card-top">
                <TournamentLogo slug={slug} name={tournament.shortName} size={52} />
                <div className="fx-tournament-card-badges">
                  <span className={`bf-badge ${tournament.status === "live" ? "bf-badge-live" : tournament.status === "upcoming" ? "bf-badge-blue" : "bf-badge-yellow"}`}>
                    {tournament.status === "live" && <span className="bf-pulse" />}
                    {tournamentStatusLabel(tournament.status)}
                  </span>
                </div>
              </div>
              <div className="fx-tournament-card-name">{tournament.shortName}</div>
              <div className="fx-tournament-card-meta">{tournament.region} · {tournament.prizePool}</div>
              <div className="fx-tournament-card-foot">
                {profile.rank > 0 ? (
                  <>
                    <span className="fx-tournament-card-stat">
                      <strong>#{profile.rank.toLocaleString()}</strong> rank
                    </span>
                    <span className="fx-tournament-card-stat">
                      <strong>{profile.totalPoints}</strong> pts
                    </span>
                  </>
                ) : hasSquad ? (
                  <span className="fx-tournament-card-stat text-[var(--bf-blue)]">
                    Plantilla {squad.length}/3
                  </span>
                ) : (
                  <span className="fx-tournament-card-stat text-[var(--bf-muted)]">Sin plantilla</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
