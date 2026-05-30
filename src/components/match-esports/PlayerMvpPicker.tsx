"use client";

import { getPlayersByTeam } from "@/lib/data";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { teamName } from "@/lib/data";

export function PlayerMvpPicker({
  teamASlug,
  teamBSlug,
  value,
  onChange,
  disabled,
}: {
  teamASlug: string;
  teamBSlug: string;
  value: string | null;
  onChange: (slug: string) => void;
  disabled?: boolean;
}) {
  const rosterA = getPlayersByTeam(teamASlug).slice(0, 5);
  const rosterB = getPlayersByTeam(teamBSlug).slice(0, 5);

  return (
    <div className="bf-mvp-picker">
      {[rosterA, rosterB].map((roster, side) => (
        <div key={side} className="bf-mvp-picker-col">
          <span className="bf-mvp-picker-team">{side === 0 ? teamName(teamASlug) : teamName(teamBSlug)}</span>
          <div className="bf-mvp-picker-grid">
            {roster.map(
              (p) =>
                p && (
                  <button
                    key={p.slug}
                    type="button"
                    className={`bf-mvp-picker-card ${value === p.slug ? "is-on" : ""}`}
                    onClick={() => onChange(p.slug)}
                    disabled={disabled}
                  >
                    <PlayerPhoto playerSlug={p.slug} teamSlug={side === 0 ? teamASlug : teamBSlug} name={p.ign} size={56} />
                    <span className="bf-mvp-picker-ign">{p.ign}</span>
                    {p.region && (
                      <span className="bf-mvp-picker-flag" title={p.region}>
                        {p.region}
                      </span>
                    )}
                    <span className="bf-mvp-picker-club">{side === 0 ? teamName(teamASlug) : teamName(teamBSlug)}</span>
                  </button>
                ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
