"use client";

import { Search } from "lucide-react";
import type { PredictTournamentTab } from "@/lib/data/predictions-filters";

export function PredictionsPickemToolbar({
  tabs,
  selectedSlug,
  onSelectTournament,
  search,
  onSearchChange,
  resultCount,
}: {
  tabs: PredictTournamentTab[];
  selectedSlug: string | null;
  onSelectTournament: (slug: string | null) => void;
  search: string;
  onSearchChange: (q: string) => void;
  resultCount: number;
}) {
  return (
    <div className="bf-predict-pickem-toolbar">
      <div className="bf-predict-pickem-search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          className="bf-predict-pickem-search-input"
          placeholder="Buscar equipo o torneo…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar predicciones por equipo o torneo"
        />
      </div>

      {tabs.length > 0 && (
        <nav className="bf-predict-tournament-jump" aria-label="Filtrar por torneo">
          <button
            type="button"
            className={`bf-predict-tjump-pill ${selectedSlug === null ? "is-on" : ""}`}
            onClick={() => onSelectTournament(null)}
          >
            Todo
          </button>
          {tabs.map((t) => (
            <button
              key={t.slug}
              type="button"
              className={`bf-predict-tjump-pill ${selectedSlug === t.slug ? "is-on" : ""}`}
              onClick={() => onSelectTournament(t.slug)}
            >
              {t.name}
              <span className="bf-predict-tjump-count">{t.openCount}</span>
            </button>
          ))}
        </nav>
      )}

      {(search.trim() || selectedSlug) && (
        <p className="bf-predict-toolbar-meta" aria-live="polite">
          {resultCount} partido{resultCount === 1 ? "" : "s"} · más próximo arriba
        </p>
      )}
    </div>
  );
}
