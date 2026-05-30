"use client";

import { useMemo } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { MapBrawlerDraftRow } from "@/components/match-esports/MapBrawlerDraftRow";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teamName } from "@/lib/data";
import { getSeriesRules } from "@/lib/data/match-format-rules";
import { allSeriesMapSlots } from "@/lib/data/series-map-utils";
import { resolveMapCatalogEntry, type MapCatalogEntry } from "@/lib/data/game-assets-catalog";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

function MapStrategicPanel({ map }: { map: MapCatalogEntry }) {
  const has =
    map.description ||
    map.best_picks?.length ||
    map.most_used?.length ||
    map.most_banned?.length ||
    map.win_rates?.length ||
    map.notes;
  if (!has) return null;

  return (
    <div className="bf-map-strategic-panel">
      <h4>Información estratégica</h4>
      {map.description && <p className="bf-map-strategic-desc">{map.description}</p>}
      {map.best_picks?.length ? (
        <div className="bf-map-strategic-group">
          <span>Mejores picks</span>
          <div className="bf-map-strategic-icons">
            {map.best_picks.map((n) => (
              <BrawlerAssetIcon key={n} name={n} size={48} hideName variant="meta" />
            ))}
          </div>
        </div>
      ) : null}
      {map.most_used?.length ? (
        <div className="bf-map-strategic-group">
          <span>Más usados</span>
          <div className="bf-map-strategic-icons">
            {map.most_used.map((n) => (
              <BrawlerAssetIcon key={n} name={n} size={48} hideName />
            ))}
          </div>
        </div>
      ) : null}
      {map.most_banned?.length ? (
        <div className="bf-map-strategic-group">
          <span>Más baneados</span>
          <div className="bf-map-strategic-icons">
            {map.most_banned.map((n) => (
              <BrawlerAssetIcon key={n} name={n} size={48} hideName variant="ban" />
            ))}
          </div>
        </div>
      ) : null}
      {map.win_rates?.length ? (
        <ul className="bf-map-win-rates">
          {map.win_rates.map((w) => (
            <li key={w.brawler}>
              <BrawlerAssetIcon name={w.brawler} size={36} hideName />
              <span>{w.brawler}</span>
              <strong>{w.rate}</strong>
            </li>
          ))}
        </ul>
      ) : null}
      {map.notes && <p className="bf-map-strategic-notes">{map.notes}</p>}
    </div>
  );
}

export function MatchMapAnalysisSection({
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
  const { maps: mapCatalog } = useGameAssetsCatalog();
  const order =
    parsed.maps?.order?.length ? parsed.maps.order : (parsed.maps?.possible ?? []);
  if (!order.length) return null;

  const series = getSeriesRules(match.format);
  const slots = useMemo(
    () => allSeriesMapSlots(order, ext.exactScore, parsed.maps?.decisive, match.format),
    [order, ext.exactScore, parsed.maps?.decisive, match.format],
  );

  const matchBans = useMemo(
    () => [...(parsed.bans?.brawlers_a ?? []), ...(parsed.bans?.brawlers_b ?? [])],
    [parsed.bans],
  );

  function setMapPicks(index: number, side: "a" | "b", picks: string[]) {
    const prev = ext.mapBrawlerPicks?.[index] ?? { a: [], b: [] };
    const row = side === "a" ? { ...prev, a: picks } : { ...prev, b: picks };
    onPatch({ mapBrawlerPicks: { ...ext.mapBrawlerPicks, [index]: row } });
  }

  function setMapBans(index: number, bans: string[]) {
    onPatch({ mapBrawlerBans: { ...ext.mapBrawlerBans, [index]: bans } });
  }

  const showDraft = interactive;

  return (
    <section className="bf-match-map-analysis bf-match-esports-panel" id="match-map-analysis">
      <header className="bf-match-section-head">
        <h2 className="bf-match-esports-h2">Análisis de mapas</h2>
        <p className="bf-match-section-lead">
          Draft por mapa (3+2+3), datos del catálogo global y contexto de la serie {series.label}.
        </p>
      </header>

      {slots.map((slot) => {
        const mapEntry = resolveMapCatalogEntry(slot.name, mapCatalog);
        const winner = ext.mapWinners?.[slot.index];
        return (
          <article
            key={`${slot.name}-${slot.index}`}
            className={`bf-map-analysis-lane ${slot.decisive ? "is-decisive-lane" : ""}`}
          >
            <header className="bf-map-analysis-hero">
              <div className="bf-map-analysis-title">
                <span className="bf-map-lane-number">Mapa {slot.index + 1}</span>
                {slot.decisive && <span className="bf-map-series-decisive-badge">Decisivo</span>}
              </div>
              <MapAssetCard
                name={slot.name}
                variant="order"
                index={slot.index}
                isDecisive={slot.decisive}
                size="lg"
              />
            </header>

            {winner && (
              <div className="bf-map-analysis-prediction">
                <span className="bf-map-analysis-pred-label">Tu predicción del mapa</span>
                <div className="bf-map-analysis-pred-duel">
                  <span className={winner === "A" ? "is-picked-team" : ""}>
                    <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={40} />
                  </span>
                  <span className="bf-map-analysis-vs">VS</span>
                  <span className={winner === "B" ? "is-picked-team" : ""}>
                    <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={40} />
                  </span>
                </div>
                <strong>
                  {teamName(winner === "A" ? match.teamASlug : match.teamBSlug)}
                </strong>
              </div>
            )}

            {showDraft && (
              <MapBrawlerDraftRow
                mapIndex={slot.index}
                ext={ext}
                teamAName={teamName(match.teamASlug)}
                teamBName={teamName(match.teamBSlug)}
                picksA={ext.mapBrawlerPicks?.[slot.index]?.a ?? []}
                picksB={ext.mapBrawlerPicks?.[slot.index]?.b ?? []}
                centralBans={ext.mapBrawlerBans?.[slot.index] ?? []}
                matchBans={matchBans}
                onPicksA={(a) => setMapPicks(slot.index, "a", a)}
                onPicksB={(b) => setMapPicks(slot.index, "b", b)}
                onCentralBans={(bans) => setMapBans(slot.index, bans)}
                interactive
              />
            )}

            {!showDraft &&
              (ext.mapBrawlerPicks?.[slot.index] || ext.mapBrawlerBans?.[slot.index]) && (
                <p className="bf-match-predict-hint">Picks guardados en tu predicción.</p>
              )}

            <MapStrategicPanel map={mapEntry} />
          </article>
        );
      })}
    </section>
  );
}
