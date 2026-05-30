"use client";

import { AdminTeamLogoPicker, type AdminTeamPickerOption } from "@/components/admin/AdminTeamLogoPicker";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function AdminPlayerTeamPicker({
  teams,
  value,
  onChange,
  compact = false,
}: {
  teams: AdminTeamPickerOption[];
  value: string | null;
  onChange: (teamSlug: string | null) => void;
  compact?: boolean;
}) {
  const current = value ? teams.find((t) => t.slug === value) : null;

  return (
    <div className="bf-admin-player-team-picker">
      <div className="bf-admin-player-team-current">
        {current ? (
          <>
            <TeamLogo key={current.slug} slug={current.slug} name={current.name} size={44} />
            <span>
              <strong>{current.tag}</strong>
              <span className="bf-admin-player-team-current-name">{current.name}</span>
            </span>
          </>
        ) : (
          <span className="bf-admin-player-team-empty">Sin equipo asignado</span>
        )}
        {value && (
          <button type="button" className="bf-home-link" onClick={() => onChange(null)}>
            Quitar del club
          </button>
        )}
      </div>
      <AdminTeamLogoPicker
        teams={teams}
        selected={value ?? ""}
        onChange={(slug) => onChange(slug || null)}
        searchPlaceholder="Buscar club para asignar…"
        maxHeight={compact ? "220px" : "280px"}
        showRegionFilter={!compact}
        compact={compact}
      />
    </div>
  );
}
