"use client";

import { useMemo } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { getMatchPredictionsConfig, parseMatchMeta } from "@/lib/data/match-meta";
import { MapPredictionLane } from "@/components/match-esports/MapPredictionLane";
import { getSeriesRules } from "@/lib/data/match-format-rules";
import {
  mapCountFromExactScore,
  resolveMatchMapOrder,
  visiblePredictionMapSlots,
} from "@/lib/data/series-map-utils";
import type { MatchPredictionPoints } from "@/lib/data/match-meta";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import { normalizeMapBans, normalizeMapTeamBans } from "@/lib/match-predictions-storage";

type Props = {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
  points: MatchPredictionPoints;
  onPatch: (p: Partial<MatchExtendedPrediction>) => void;
  interactive?: boolean;
};

/**
 * Lista vertical: MAPA 1, MAPA 2, MAPA 3 (decisivo si 1-1) — cada uno con ganador + draft completo.
 */
export function MatchMapSeriesBoard({ match, meta, ext, points, onPatch, interactive }: Props) {
  const parsed = parseMatchMeta(meta);
  const cfg = getMatchPredictionsConfig(parsed);
  const mapOrder = useMemo(
    () => resolveMatchMapOrder(parsed, match.format),
    [parsed, match.format],
  );
  const manualDecisive = parsed.maps?.decisive;
  const mapCurrent = parsed.maps?.current;
  const slots = useMemo(
    () =>
      visiblePredictionMapSlots(mapOrder, ext.exactScore, manualDecisive, match.format),
    [mapOrder, ext.exactScore, manualDecisive, match.format],
  );

  const matchBans = useMemo(
    () => [...(parsed.bans?.brawlers_a ?? []), ...(parsed.bans?.brawlers_b ?? [])],
    [parsed.bans],
  );

  const mapCount = mapCountFromExactScore(ext.exactScore, match.format);

  const showMapWinners = cfg.map_winners || cfg.advanced || mapOrder.length > 0;
  const showDraft = cfg.map_brawler_picks || cfg.advanced || mapOrder.length > 0;

  if (!showMapWinners && !showDraft) return null;
  if (!slots.length) return null;

  function setMapWinner(index: number, side: "A" | "B") {
    onPatch({ mapWinners: { ...ext.mapWinners, [index]: side } });
  }

  function setMapPicks(index: number, side: "a" | "b", picks: string[]) {
    const prev = ext.mapBrawlerPicks?.[index] ?? { a: [], b: [] };
    const row = side === "a" ? { ...prev, a: picks } : { ...prev, b: picks };
    onPatch({ mapBrawlerPicks: { ...ext.mapBrawlerPicks, [index]: row } });
  }

  function setMapBans(index: number, bans: string[]) {
    onPatch({ mapBrawlerBans: { ...normalizeMapBans(ext), [index]: bans } });
  }

  function setMapTeamBans(index: number, side: "a" | "b", bans: string[]) {
    const prev = normalizeMapTeamBans(ext)[index] ?? { a: [], b: [] };
    const row = side === "a" ? { ...prev, a: bans } : { ...prev, b: bans };
    onPatch({ mapTeamBans: { ...normalizeMapTeamBans(ext), [index]: row } });
  }

  const gridClass =
    slots.length === 5
      ? "is-maps-5"
      : slots.length === 4
        ? "is-maps-4"
        : slots.length >= 3
          ? "is-maps-3"
          : "";

  return (
    <div className="bf-map-series-board is-per-map-list">
      <div className={`bf-map-pred-lanes bf-map-series-grid ${gridClass}`}>
        {slots.map((slot) => (
          <MapPredictionLane
            key={`${slot.name}-${slot.index}`}
            slot={slot}
            match={match}
            meta={meta}
            ext={ext}
            mapCurrent={mapCurrent}
            showWinner={showMapWinners}
            showDraft={showDraft}
            interactive={interactive}
            onMapWinner={(side) => setMapWinner(slot.index, side)}
            onPicksA={(a) => setMapPicks(slot.index, "a", a)}
            onPicksB={(b) => setMapPicks(slot.index, "b", b)}
            onBans={(bans) => setMapBans(slot.index, bans)}
            onTeamBansA={(bans) => setMapTeamBans(slot.index, "a", bans)}
            onTeamBansB={(bans) => setMapTeamBans(slot.index, "b", bans)}
            matchBans={matchBans}
            points={points}
          />
        ))}
      </div>
    </div>
  );
}
