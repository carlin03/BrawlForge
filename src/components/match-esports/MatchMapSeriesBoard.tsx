"use client";

import { useMemo } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { getMatchPredictionsConfig, parseMatchMeta } from "@/lib/data/match-meta";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { TeamSidePick } from "@/components/match-esports/TeamSidePick";
import { MapBrawlerDraftRow } from "@/components/match-esports/MapBrawlerDraftRow";
import { teamName } from "@/lib/data";
import {
  getSeriesRules,
  parseExactScore,
} from "@/lib/data/match-format-rules";
import {
  decisiveMapIndexFromExactString,
  decisiveMapIndexFromSeriesScore,
  mapOrderWithDecisive,
  maxMapsInSeries,
} from "@/lib/data/series-map-utils";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import { normalizeMapBans } from "@/lib/match-predictions-storage";

type Props = {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
  onPatch: (p: Partial<MatchExtendedPrediction>) => void;
  interactive?: boolean;
};

export function MatchMapSeriesBoard({ match, meta, ext, onPatch, interactive }: Props) {
  const parsed = parseMatchMeta(meta);
  const cfg = getMatchPredictionsConfig(parsed);
  const pool = parsed.maps?.possible ?? [];
  const playedOrder = parsed.maps?.played?.map((e) => e.name) ?? [];
  const order =
    parsed.maps?.order?.length ? parsed.maps.order : playedOrder.length ? playedOrder : pool;
  const manualDecisive = parsed.maps?.decisive;
  const current = parsed.maps?.current;
  const series = getSeriesRules(match.format);
  const maxMaps = maxMapsInSeries(match.format);

  const decisiveFromScore = useMemo(() => {
    const fromExact = decisiveMapIndexFromExactString(ext.exactScore, match.format);
    if (fromExact != null) return fromExact;
    const p = parseExactScore(ext.exactScore);
    if (p) return decisiveMapIndexFromSeriesScore(p.a, p.b, match.format);
    return null;
  }, [ext.exactScore, match.format]);

  const slots = useMemo(
    () => mapOrderWithDecisive(order, decisiveFromScore, manualDecisive, match.format),
    [order, decisiveFromScore, manualDecisive, match.format],
  );

  const matchBans = useMemo(
    () => [...(parsed.bans?.brawlers_a ?? []), ...(parsed.bans?.brawlers_b ?? [])],
    [parsed.bans],
  );

  if (!order.length && !pool.length) return null;

  const showMapWinners = cfg.map_winners && interactive;
  const showDraft = cfg.map_brawler_picks;
  const showDraftInteractive = showDraft && interactive;
  const showWinnerReadonly = cfg.map_winners && !interactive;
  const showDraftReadonly = showDraft && !interactive;

  function setMapWinner(index: number, side: "A" | "B") {
    onPatch({ mapWinners: { ...ext.mapWinners, [index]: side } });
  }

  function setMapPicks(index: number, side: "a" | "b", picks: string[]) {
    const prev = ext.mapBrawlerPicks?.[index] ?? { a: [], b: [] };
    const row = side === "a" ? { ...prev, a: picks } : { ...prev, b: picks };
    onPatch({ mapBrawlerPicks: { ...ext.mapBrawlerPicks, [index]: row } });
  }

  function setMapBans(index: number, bans: string[]) {
    const mapBrawlerBans = { ...normalizeMapBans(ext), [index]: bans };
    onPatch({ mapBrawlerBans });
  }

  return (
    <div className="bf-map-series-board is-premium">
      <div className="bf-map-series-format-head">
        <span className="bf-map-series-format-badge">{series.label}</span>
        <span className="bf-map-series-format-hint">
          Hasta {maxMaps} mapas · {slots.length} en el pool de este partido
        </span>
        <div className="bf-map-series-index-strip" aria-hidden>
          {slots.map((s) => (
            <span
              key={s.index}
              className={`bf-map-series-index-pill ${s.decisive ? "is-decisive" : ""} ${current === s.name ? "is-live" : ""}`}
            >
              {s.index + 1}
            </span>
          ))}
        </div>
      </div>

      {slots.map((slot) => (
        <article
          key={`${slot.name}-${slot.index}`}
          className={`bf-map-lane-card ${slot.decisive ? "is-decisive-lane" : ""} ${current === slot.name ? "is-live" : ""}`}
        >
          <header className="bf-map-lane-header">
            <div className="bf-map-lane-title">
              <span className="bf-map-lane-number">Mapa {slot.index + 1}</span>
              {slot.decisive && <span className="bf-map-series-decisive-badge">Mapa decisivo</span>}
              {current === slot.name && <span className="bf-map-lane-live-tag">En juego</span>}
            </div>
            <div className="bf-map-lane-hero">
              <MapAssetCard
                name={slot.name}
                variant="order"
                index={slot.index}
                isCurrent={current === slot.name}
                isDecisive={slot.decisive}
                size="lg"
              />
            </div>
          </header>

          {(showMapWinners || showWinnerReadonly) && (
            <div className="bf-map-lane-winner">
              {interactive ? (
                <TeamSidePick
                  label={`Ganador · Mapa ${slot.index + 1}`}
                  teamASlug={match.teamASlug}
                  teamBSlug={match.teamBSlug}
                  teamAName={teamName(match.teamASlug)}
                  teamBName={teamName(match.teamBSlug)}
                  value={ext.mapWinners?.[slot.index] ?? null}
                  onChange={(v) => v && setMapWinner(slot.index, v)}
                />
              ) : ext.mapWinners?.[slot.index] ? (
                <p className="bf-map-lane-winner-readonly">
                  Ganador predicho:{" "}
                  <strong>
                    {teamName(
                      ext.mapWinners[slot.index] === "A" ? match.teamASlug : match.teamBSlug,
                    )}
                  </strong>
                </p>
              ) : null}
            </div>
          )}

          {(showDraftInteractive || showDraftReadonly) && (
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
              interactive={showDraftInteractive}
            />
          )}
        </article>
      ))}
    </div>
  );
}
