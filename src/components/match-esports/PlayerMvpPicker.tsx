"use client";

import { getPlayersByTeam, teamName } from "@/lib/data";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";

function PlayerCard({
  p,
  clubSlug,
  clubName,
  value,
  onChange,
  disabled,
}: {
  p: NonNullable<ReturnType<typeof getPlayersByTeam>[number]>;
  clubSlug: string;
  clubName: string;
  value: string | null;
  onChange: (slug: string) => void;
  disabled?: boolean;
}) {
  return (
    <button
      key={p.slug}
      type="button"
      className={`bf-mvp-picker-card is-premium ${value === p.slug ? "is-on" : ""}`}
      onClick={() => onChange(p.slug)}
      disabled={disabled}
    >
      <div className="bf-mvp-picker-photo-wrap">
        <PlayerPhoto playerSlug={p.slug} teamSlug={clubSlug} name={p.ign} size={72} />
        {p.region && p.region !== "GLOBAL" && (
          <CountryFlag country={p.region} size={18} className="bf-mvp-picker-flag-badge" />
        )}
      </div>
      <span className="bf-mvp-picker-ign">{p.ign}</span>
      <span className="bf-mvp-picker-club">{clubName}</span>
      <div className="bf-mvp-picker-stats">
        {p.rating != null && (
          <span className="bf-mvp-picker-stat">
            <em>Rating</em> {p.rating.toFixed(1)}
          </span>
        )}
        {p.fantasyPoints != null && (
          <span className="bf-mvp-picker-stat">
            <em>FP</em> {p.fantasyPoints}
          </span>
        )}
        {p.role && <span className="bf-mvp-picker-stat is-role">{p.role}</span>}
      </div>
      {value === p.slug && <span className="bf-mvp-picker-mvp-tag">MVP pick</span>}
    </button>
  );
}

export function PlayerMvpPicker({
  teamASlug,
  teamBSlug,
  value,
  onChange,
  disabled,
  viewMode = "teams",
}: {
  teamASlug: string;
  teamBSlug: string;
  value: string | null;
  onChange: (slug: string) => void;
  disabled?: boolean;
  /** Equipos: dos columnas. Jugadores: rejilla única de todos. */
  viewMode?: "teams" | "players";
}) {
  const rosterA = getPlayersByTeam(teamASlug).slice(0, 6);
  const rosterB = getPlayersByTeam(teamBSlug).slice(0, 6);

  if (viewMode === "players") {
    const all = [...rosterA, ...rosterB].filter(Boolean);
    return (
      <div className="bf-mvp-picker is-premium is-all-players">
        <div className="bf-mvp-picker-grid is-flat">
          {all.map(
            (p) =>
              p && (
                <PlayerCard
                  key={p.slug}
                  p={p}
                  clubSlug={p.teamSlug === teamBSlug ? teamBSlug : teamASlug}
                  clubName={teamName(p.teamSlug === teamBSlug ? teamBSlug : teamASlug)}
                  value={value}
                  onChange={onChange}
                  disabled={disabled}
                />
              ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bf-mvp-picker is-premium">
      {[rosterA, rosterB].map((roster, side) => {
        const clubSlug = side === 0 ? teamASlug : teamBSlug;
        const clubName = teamName(clubSlug);
        return (
          <div key={side} className="bf-mvp-picker-col">
            <div className="bf-mvp-picker-head">
              <TeamLogo slug={clubSlug} name={clubName} size={28} />
              <span className="bf-mvp-picker-team">{clubName}</span>
            </div>
            <div className="bf-mvp-picker-grid">
              {roster.map(
                (p) =>
                  p && (
                    <PlayerCard
                      key={p.slug}
                      p={p}
                      clubSlug={clubSlug}
                      clubName={clubName}
                      value={value}
                      onChange={onChange}
                      disabled={disabled}
                    />
                  ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
