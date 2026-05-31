"use client";

import { TeamLogo } from "@/components/ui/TeamLogo";

export function TeamSidePick({
  label,
  teamASlug,
  teamBSlug,
  teamAName,
  teamBName,
  value,
  onChange,
  disabled,
  showVs,
  inline,
}: {
  label: string;
  teamASlug: string;
  teamBSlug: string;
  teamAName: string;
  teamBName: string;
  value: "A" | "B" | null;
  onChange: (v: "A" | "B") => void;
  disabled?: boolean;
  showVs?: boolean;
  /** Fuerza equipos izquierda/derecha (no apilar en móvil). */
  inline?: boolean;
}) {
  return (
    <div className={`bf-team-side-pick${inline ? " is-inline" : ""}`}>
      {label ? <span className="bf-team-side-pick-label">{label}</span> : null}
      <div className={`bf-team-side-pick-row${showVs ? " has-vs" : ""}${inline ? " is-inline" : ""}`}>
        <button
          type="button"
          className={`bf-team-side-pick-btn is-blue ${value === "A" ? "is-on" : ""}`}
          onClick={() => onChange("A")}
          disabled={disabled}
        >
          <TeamLogo slug={teamASlug} name={teamAName} size={40} />
          <span>{teamAName}</span>
        </button>
        {showVs && <span className="bf-team-side-pick-vs">VS</span>}
        <button
          type="button"
          className={`bf-team-side-pick-btn is-red ${value === "B" ? "is-on" : ""}`}
          onClick={() => onChange("B")}
          disabled={disabled}
        >
          <TeamLogo slug={teamBSlug} name={teamBName} size={40} />
          <span>{teamBName}</span>
        </button>
      </div>
    </div>
  );
}
