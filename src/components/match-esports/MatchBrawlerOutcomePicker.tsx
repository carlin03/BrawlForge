"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

function OutcomeRow({
  title,
  hint,
  points,
  value,
  suggestions,
  banned,
  onChange,
}: {
  title: string;
  hint: string;
  points?: number;
  value?: string;
  suggestions: string[];
  banned: string[];
  onChange: (name: string | undefined) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bf-brawler-outcome-row">
      <div className="bf-brawler-outcome-head">
        <div>
          <h4 className="bf-match-predict-subh">
            {title}
            <PredictionPointBadge points={points} />
          </h4>
          <p className="bf-brawler-outcome-hint">{hint}</p>
        </div>
        <div className="bf-brawler-outcome-current">
          {value ? (
            <BrawlerAssetIcon
              name={value}
              size={56}
              selected
              onClick={() => onChange(undefined)}
            />
          ) : (
            <span className="bf-brawler-outcome-empty">—</span>
          )}
          {suggestions.length > 0 && (
            <div className="bf-brawler-outcome-cycle">
              <button
                type="button"
                className="bf-brawler-outcome-cycle-btn"
                aria-label="Anterior sugerencia"
                onClick={() => onChange(cycleInList(suggestions, value, -1))}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="bf-brawler-outcome-cycle-btn"
                aria-label="Siguiente sugerencia"
                onClick={() => onChange(cycleInList(suggestions, value, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bf-brawler-outcome-suggestions">
          {suggestions.slice(0, 8).map((name) => (
            <button
              key={name}
              type="button"
              className={`bf-brawler-outcome-chip ${value?.toLowerCase() === name.toLowerCase() ? "is-on" : ""}`}
              onClick={() => onChange(name)}
            >
              <BrawlerAssetIcon name={name} size={40} hideName />
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="bf-brawler-outcome-toggle"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "Ocultar buscador" : "Buscar otro brawler"}
      </button>
      {expanded && (
        <BrawlerSearchPicker
          selected={value ? [value] : []}
          onChange={(list) => onChange(list[0])}
          banned={banned}
          max={1}
          pool={suggestions}
        />
      )}
    </div>
  );
}

/** Predicción de brawlers del partido: mejor WR, más usado, más bloqueado (datos API). */
export function MatchBrawlerOutcomePicker({
  match,
  meta,
  ext,
  matchBans,
  points,
  showWr,
  showMostUsed,
  showMostBanned,
  onPatch,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: { brawlerMvp?: string; brawlerMostUsed?: string; brawlerMostBanned?: string };
  matchBans: string[];
  points: MatchPredictionPoints;
  showWr: boolean;
  showMostUsed: boolean;
  showMostBanned: boolean;
  onPatch: (p: {
    brawlerMvp?: string;
    brawlerMostUsed?: string;
    brawlerMostBanned?: string;
  }) => void;
}) {
  const { maps: mapCatalog } = useGameAssetsCatalog();
  const mapOrder = useMemo(() => resolveMatchMapOrder(meta, match.format), [meta, match.format]);
  const suggestions = useMemo(
    () => aggregateMapBrawlerSuggestions(mapOrder, meta, mapCatalog),
    [mapOrder, meta, mapCatalog],
  );

  if (!showWr && !showMostUsed && !showMostBanned) return null;

  return (
    <div className="bf-brawler-outcome-picker">
      {showWr && (
        <OutcomeRow
          title="Mejor win rate"
          hint="Mayor WR en los mapas de la serie"
          points={points.brawler_mvp}
          value={ext.brawlerMvp}
          suggestions={suggestions.byWr}
          banned={matchBans}
          onChange={(n) => onPatch({ brawlerMvp: n })}
        />
      )}
      {showMostUsed && (
        <OutcomeRow
          title="Más usado / repetido"
          hint="El brawler que más veces salió en la serie"
          points={points.brawler_most_used}
          value={ext.brawlerMostUsed}
          suggestions={suggestions.mostUsed}
          banned={matchBans}
          onChange={(n) => onPatch({ brawlerMostUsed: n })}
        />
      )}
      {showMostBanned && (
        <OutcomeRow
          title="Más bloqueado"
          hint="Bans frecuentes en estos mapas"
          points={points.brawler_ban}
          value={ext.brawlerMostBanned}
          suggestions={suggestions.mostBanned}
          banned={matchBans}
          onChange={(n) => onPatch({ brawlerMostBanned: n })}
        />
      )}
    </div>
  );
}
