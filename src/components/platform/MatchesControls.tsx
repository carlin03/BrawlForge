"use client";

import { Search, X } from "lucide-react";
import type { Region } from "@/lib/types";
import type { MatchTab } from "@/lib/data/matches-hub";

const REGIONS: { id: Region | "all"; label: string }[] = [
  { id: "all", label: "Global" },
  { id: "EMEA", label: "EMEA" },
  { id: "NA", label: "NA" },
  { id: "SA", label: "SA" },
  { id: "EA", label: "EA" },
];

export function MatchesControls({
  tab,
  onTabChange,
  counts,
  region,
  onRegionChange,
  tournamentSlug,
  onTournamentChange,
  tournaments,
  query,
  onQueryChange,
}: {
  tab: MatchTab;
  onTabChange: (t: MatchTab) => void;
  counts: { live: number; upcoming: number; results: number };
  region: Region | "all";
  onRegionChange: (r: Region | "all") => void;
  tournamentSlug: string;
  onTournamentChange: (slug: string) => void;
  tournaments: { slug: string; label: string; count: number }[];
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const tabs: { id: MatchTab; label: string; count: number }[] = [
    { id: "live", label: "En directo", count: counts.live },
    { id: "upcoming", label: "Próximos", count: counts.upcoming },
    { id: "results", label: "Resultados", count: counts.results },
  ];

  return (
    <div className="bf-matches-controls">
      <div className="bf-matches-controls-tabs" role="tablist" aria-label="Estado del partido">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`bf-matches-tab ${tab === t.id ? "is-on" : ""} ${t.id === "live" && t.count > 0 ? "has-live" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            <span>{t.label}</span>
            <span className="bf-matches-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="bf-matches-controls-toolbar">
        <label className="bf-matches-search">
          <Search size={18} aria-hidden />
          <span className="sr-only">Buscar equipos o torneo</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar club, torneo o fase…"
            autoComplete="off"
          />
          {query ? (
            <button type="button" className="bf-matches-search-clear" onClick={() => onQueryChange("")} aria-label="Limpiar">
              <X size={16} />
            </button>
          ) : null}
        </label>

        <select
          className="bf-matches-select"
          value={tournamentSlug}
          onChange={(e) => onTournamentChange(e.target.value)}
          aria-label="Filtrar por torneo"
        >
          <option value="all">Todos los torneos</option>
          {tournaments.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.label} ({t.count})
            </option>
          ))}
        </select>
      </div>

      <div className="bf-matches-region-row" role="group" aria-label="Región">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`bf-matches-region-chip ${region === r.id ? "is-on" : ""}`}
            onClick={() => onRegionChange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
