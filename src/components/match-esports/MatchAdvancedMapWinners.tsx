"use client";

import { useMemo } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { getMatchPredictionsConfig, parseMatchMeta } from "@/lib/data/match-meta";
import { TeamSidePick } from "@/components/match-esports/TeamSidePick";
import { teamName } from "@/lib/data";
import { getSeriesRules } from "@/lib/data/match-format-rules";
import {
  initialMapsVisibleCount,
  isDecisiveExactScore,
  maxMapsInSeries,
  visiblePredictionMapSlots,
} from "@/lib/data/series-map-utils";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

export function MatchAdvancedMapWinners({
  match,
  meta,
  ext,
  onPatch,
  interactive,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
  onPatch: (p: Partial<MatchExtendedPrediction>) => void;
  interactive?: boolean;
}) {
  const parsed = parseMatchMeta(meta);
  const cfg = getMatchPredictionsConfig(parsed);
  if (!cfg.map_winners) return null;

  const order =
    parsed.maps?.order?.length ? parsed.maps.order : (parsed.maps?.possible ?? []);
  if (!order.length) return null;

  const series = getSeriesRules(match.format);
  const slots = useMemo(
    () =>
      visiblePredictionMapSlots(
        order,
        ext.exactScore,
        parsed.maps?.decisive,
        match.format,
      ),
    [order, ext.exactScore, parsed.maps?.decisive, match.format],
  );

  const needsDecisiveHint =
    interactive &&
    !isDecisiveExactScore(ext.exactScore, match.format) &&
    maxMapsInSeries(match.format) > initialMapsVisibleCount(match.format);

  function setMapWinner(index: number, side: "A" | "B") {
    onPatch({ mapWinners: { ...ext.mapWinners, [index]: side } });
  }

  return (
    <div className="bf-match-advanced-maps">
      <header className="bf-match-subsection-head">
        <h3 className="bf-match-esports-h3">Predicciones avanzadas</h3>
        <p className="bf-match-section-lead">
          Ganador por mapa · {series.label}. Solo se muestran los mapas relevantes según tu marcador
          exacto.
        </p>
      </header>
      {needsDecisiveHint && interactive && (
        <p className="bf-match-predict-hint">
          Predice un marcador decisivo (p. ej. 2-1 en BO3, 3-2 en BO5) para desbloquear el último mapa.
        </p>
      )}
      <div className="bf-advanced-map-winners-grid">
        {slots.map((slot) => (
          <div
            key={slot.index}
            className={`bf-advanced-map-winner-card ${slot.decisive ? "is-decisive" : ""}`}
          >
            <span className="bf-advanced-map-winner-num">
              Mapa {slot.index + 1}
              {slot.decisive && <em>decisivo</em>}
            </span>
            <span className="bf-advanced-map-winner-name">{slot.name}</span>
            {interactive ? (
              <TeamSidePick
                label=""
                teamASlug={match.teamASlug}
                teamBSlug={match.teamBSlug}
                teamAName={teamName(match.teamASlug, match)}
                teamBName={teamName(match.teamBSlug, match)}
                value={ext.mapWinners?.[slot.index] ?? null}
                onChange={(v) => v && setMapWinner(slot.index, v)}
              />
            ) : ext.mapWinners?.[slot.index] ? (
              <p className="bf-advanced-map-winner-pick">
                {teamName(
                  ext.mapWinners[slot.index] === "A" ? match.teamASlug : match.teamBSlug,
                )}
              </p>
            ) : (
              <p className="bf-match-predict-hint">—</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
