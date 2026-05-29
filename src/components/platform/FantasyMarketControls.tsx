"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeam } from "@/lib/data";
import { getTeamCardTheme, teamCardThemeVars } from "@/lib/data/team-card-theme";

export type FantasySortKey = "price" | "rating" | "change" | "pick";

const SORT_LABELS: Record<FantasySortKey, string> = {
  price: "Precio",
  rating: "Rating",
  change: "Δ precio",
  pick: "Propiedad",
};

export function FantasyMarketControls({
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  teamFilter,
  onTeamFilterChange,
  teamGroups,
  teamCount,
  playerCount,
  catalogFromDb,
  catalogSyncedAt,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  sortBy: FantasySortKey;
  onSortChange: (k: FantasySortKey) => void;
  teamFilter: string;
  onTeamFilterChange: (slug: string) => void;
  teamGroups: { teamSlug: string; players: string[] }[];
  teamCount: number;
  playerCount: number;
  catalogFromDb?: boolean;
  catalogSyncedAt?: string | null;
}) {
  const sortKeys = Object.keys(SORT_LABELS) as FantasySortKey[];

  return (
    <div className="bf-fantasy-market-controls">
      <div className="bf-fantasy-market-controls-head">
        <div>
          <p className="bf-fantasy-market-controls-kicker">
            <SlidersHorizontal size={14} aria-hidden />
            Mercado fantasy
          </p>
          <p className="bf-fantasy-market-controls-meta">
            <span className="bf-fantasy-market-stat-pill">
              <strong>{teamCount}</strong> clubes
            </span>
            <span className="bf-fantasy-market-stat-pill">
              <strong>{playerCount}</strong> jugadores
            </span>
            {catalogFromDb && <span className="bf-fantasy-market-live">Catálogo en vivo</span>}
            {catalogFromDb && catalogSyncedAt && (
              <span className="bf-fantasy-market-sync">
                {new Date(catalogSyncedAt).toLocaleDateString("es")}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bf-fantasy-market-controls-row">
        <label className="bf-fantasy-market-search">
          <Search size={18} aria-hidden />
          <span className="sr-only">Buscar jugador o club</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por IGN o club…"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              className="bf-fantasy-market-search-clear"
              onClick={() => onQueryChange("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          ) : null}
        </label>

        <div className="bf-fantasy-market-sort" role="group" aria-label="Ordenar mercado">
          <span className="bf-fantasy-market-sort-label">Orden</span>
          <div className="bf-fantasy-market-sort-seg">
            {sortKeys.map((k) => (
              <button
                key={k}
                type="button"
                className={sortBy === k ? "is-on" : ""}
                onClick={() => onSortChange(k)}
              >
                {SORT_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bf-fantasy-market-clubs">
        <span className="bf-fantasy-market-clubs-label">Filtrar club</span>
        <div className="bf-fantasy-club-rail" role="listbox" aria-label="Filtrar por club">
          <button
            type="button"
            role="option"
            aria-selected={teamFilter === "all"}
            className={`bf-fantasy-club-pill is-all ${teamFilter === "all" ? "is-on" : ""}`}
            onClick={() => onTeamFilterChange("all")}
          >
            <span className="bf-fantasy-club-pill-logo is-all-logo">★</span>
            <span className="bf-fantasy-club-pill-tag">Todos</span>
            <span className="bf-fantasy-club-pill-count">{playerCount}</span>
          </button>

          {teamGroups.map((g) => {
            const team = getTeam(g.teamSlug);
            if (!team) return null;
            const on = teamFilter === g.teamSlug;
            const theme = getTeamCardTheme(g.teamSlug, team.region);
            return (
              <button
                key={g.teamSlug}
                type="button"
                role="option"
                aria-selected={on}
                className={`bf-fantasy-club-pill has-team ${on ? "is-on" : ""}`}
                style={on ? teamCardThemeVars(theme) : undefined}
                onClick={() => onTeamFilterChange(g.teamSlug)}
                title={team.name}
              >
                <span
                  className="bf-fantasy-club-pill-logo"
                  style={
                    on
                      ? undefined
                      : {
                          background: `color-mix(in srgb, ${theme.secondary} 85%, #0a0c12)`,
                          borderColor: `color-mix(in srgb, ${theme.primary} 35%, transparent)`,
                        }
                  }
                >
                  <TeamLogo slug={g.teamSlug} name={team.name} size={36} glow={false} />
                </span>
                <span className="bf-fantasy-club-pill-tag">{team.tag}</span>
                <span className="bf-fantasy-club-pill-count">{g.players.length}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
