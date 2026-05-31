"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { BrawlerSearchPicker } from "@/components/match-esports/BrawlerSearchPicker";
import { PredictionPointBadge } from "@/components/match-esports/PredictionPointBadge";
import { aggregateMapBrawlerSuggestions } from "@/lib/data/map-brawler-suggestions";
import { resolveMatchMapOrder } from "@/lib/data/series-map-utils";
import type { MatchMeta, MatchPredictionPoints } from "@/lib/data/match-meta";
import type { EsportsMatch } from "@/lib/data/matches";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";

function cycleInList(list: string[], current: string | undefined, dir: 1 | -1): string | undefined {
  if (!list.length) return current;
  if (!current) return list[0];
  const i = list.findIndex((n) => n.toLowerCase() === current.toLowerCase());
  const next = i < 0 ? 0 : (i + dir + list.length) % list.length;
  return list[next];
}

function StatSlot({
  title,
  shortLabel,
  points,
  value,
  suggestions,
  banned,
  onChange,
}: {
  title: string;
  shortLabel: string;
  points?: number;
  value?: string;
  suggestions: string[];
  banned: string[];
  onChange: (name: string | undefined) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className={`bf-brawler-stat-slot ${value ? "has-pick" : ""}`}>
      <div className="bf-brawler-stat-slot-head">
        <span className="bf-brawler-stat-slot-label">{shortLabel}</span>
        <PredictionPointBadge points={points} />
      </div>
      <p className="bf-brawler-stat-slot-title">{title}</p>
      <div className="bf-brawler-stat-slot-body">
        <button
          type="button"
          className="bf-brawler-stat-slot-icon"
          onClick={() => (value ? onChange(undefined) : suggestions[0] && onChange(suggestions[0]))}
          title={value ? "Quitar" : "Elegir"}
        >
          {value ? (
            <BrawlerAssetIcon name={value} size={52} selected hideName />
          ) : (
            <span className="bf-brawler-stat-slot-empty">+</span>
          )}
        </button>
        {value && <span className="bf-brawler-stat-slot-name">{value}</span>}
        {suggestions.length > 0 && (
          <div className="bf-brawler-stat-slot-cycle">
            <button
              type="button"
              className="bf-brawler-stat-cycle-btn"
              aria-label="Anterior"
              onClick={() => onChange(cycleInList(suggestions, value, -1))}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="bf-brawler-stat-cycle-btn"
              aria-label="Siguiente"
              onClick={() => onChange(cycleInList(suggestions, value, 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      {suggestions.length > 0 && !value && (
        <div className="bf-brawler-stat-mini-chips">
          {suggestions.slice(0, 4).map((name) => (
            <button
              key={name}
              type="button"
              className="bf-brawler-stat-mini-chip"
              onClick={() => onChange(name)}
              title={name}
            >
              <BrawlerAssetIcon name={name} size={28} hideName />
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="bf-brawler-stat-search-toggle"
        onClick={() => setSearchOpen((o) => !o)}
      >
        <Search size={12} />
        {searchOpen ? "Cerrar" : "Buscar"}
      </button>
      {searchOpen && (
        <div className="bf-brawler-stat-search-panel">
          <BrawlerSearchPicker
            selected={value ? [value] : []}
            onChange={(list) => onChange(list[0])}
            banned={banned}
            max={1}
            pool={suggestions}
          />
        </div>
      )}
    </div>
  );
}

/** Cuatro predicciones compactas: mayor WR, más usado, más bloqueado, menor WR. */
export function MatchBrawlerStatSidebar({
  match,
  meta,
  ext,
  matchBans,
  points,
  showWr,
  showMostUsed,
  showMostBanned,
  showLowestWr,
  onPatch,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: {
    brawlerMvp?: string;
    brawlerMostUsed?: string;
    brawlerMostBanned?: string;
    brawlerLowestWr?: string;
  };
  matchBans: string[];
  points: MatchPredictionPoints;
  showWr: boolean;
  showMostUsed: boolean;
  showMostBanned: boolean;
  showLowestWr: boolean;
  onPatch: (p: {
    brawlerMvp?: string;
    brawlerMostUsed?: string;
    brawlerMostBanned?: string;
    brawlerLowestWr?: string;
  }) => void;
}) {
  const { maps: mapCatalog } = useGameAssetsCatalog();
  const mapOrder = useMemo(() => resolveMatchMapOrder(meta, match.format), [meta, match.format]);
  const suggestions = useMemo(
    () => aggregateMapBrawlerSuggestions(mapOrder, meta, mapCatalog),
    [mapOrder, meta, mapCatalog],
  );

  if (!showWr && !showMostUsed && !showMostBanned && !showLowestWr) return null;

  return (
    <aside className="bf-brawler-stat-sidebar" aria-label="Predicción de brawlers del partido">
      {showWr && (
        <StatSlot
          title="Mayor win rate"
          shortLabel="WR+"
          points={points.brawler_mvp}
          value={ext.brawlerMvp}
          suggestions={suggestions.byWr}
          banned={matchBans}
          onChange={(n) => onPatch({ brawlerMvp: n })}
        />
      )}
      {showMostUsed && (
        <StatSlot
          title="Más usado"
          shortLabel="USO"
          points={points.brawler_most_used}
          value={ext.brawlerMostUsed}
          suggestions={suggestions.mostUsed}
          banned={matchBans}
          onChange={(n) => onPatch({ brawlerMostUsed: n })}
        />
      )}
      {showMostBanned && (
        <StatSlot
          title="Más bloqueado"
          shortLabel="BAN"
          points={points.brawler_most_banned ?? points.brawler_ban}
          value={ext.brawlerMostBanned}
          suggestions={suggestions.mostBanned}
          banned={matchBans}
          onChange={(n) => onPatch({ brawlerMostBanned: n })}
        />
      )}
      {showLowestWr && (
        <StatSlot
          title="Menor win rate"
          shortLabel="WR−"
          points={points.brawler_lowest_wr}
          value={ext.brawlerLowestWr}
          suggestions={suggestions.lowestWr}
          banned={matchBans}
          onChange={(n) => onPatch({ brawlerLowestWr: n })}
        />
      )}
    </aside>
  );
}
