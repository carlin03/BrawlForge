"use client";

import { useMemo } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { getMatchPredictionsConfig, parseMatchMeta } from "@/lib/data/match-meta";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { TeamSidePick } from "@/components/match-esports/TeamSidePick";
import { BrawlerSearchPicker } from "@/components/match-esports/BrawlerSearchPicker";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teamName } from "@/lib/data";
import {
  decisiveMapIndexFromExactString,
  decisiveMapIndexFromSeriesScore,
  mapOrderWithDecisive,
} from "@/lib/data/series-map-utils";
import { parseExactScore } from "@/lib/data/match-format-rules";
import type { MatchExtendedPrediction, MapTeamPicks } from "@/lib/match-predictions-storage";
import { MAX_BRAWLER_BANS_PER_TEAM } from "@/lib/data/game-assets-catalog";

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

  const allBanned = useMemo(
    () => [
      ...(parsed.bans?.brawlers_a ?? []),
      ...(parsed.bans?.brawlers_b ?? []),
      ...(ext.brawlerBansA ?? []),
      ...(ext.brawlerBansB ?? []),
    ],
    [parsed.bans, ext.brawlerBansA, ext.brawlerBansB],
  );

  if (!order.length && !pool.length) return null;

  function setMapWinner(index: number, side: "A" | "B") {
    const next = { ...ext.mapWinners, [index]: side };
    onPatch({ mapWinners: next });
  }

  function setMapPicks(index: number, side: "a" | "b", picks: string[]) {
    const prev: MapTeamPicks = ext.mapBrawlerPicks?.[index] ?? { a: [], b: [] };
    const row = side === "a" ? { ...prev, a: picks } : { ...prev, b: picks };
    onPatch({ mapBrawlerPicks: { ...ext.mapBrawlerPicks, [index]: row } });
  }

  const showMapWinners = cfg.map_winners && interactive;
  const showMapPicks = cfg.map_brawler_picks && interactive;
  const showBrawlerBans =
    interactive && (cfg.map_brawler_picks || cfg.map_winners);

  return (
    <div className="bf-map-series-board">
      {showBrawlerBans && (
        <div className="bf-map-series-bans-predict">
          <h3>Bans de brawlers (predicción)</h3>
          <div className="bf-map-series-bans-cols">
            <BrawlerSearchPicker
              label={teamName(match.teamASlug)}
              selected={ext.brawlerBansA ?? []}
              onChange={(brawlerBansA) => onPatch({ brawlerBansA })}
              banned={[
                ...(parsed.bans?.brawlers_a ?? []),
                ...(parsed.bans?.brawlers_b ?? []),
                ...(ext.brawlerBansB ?? []),
              ]}
              max={MAX_BRAWLER_BANS_PER_TEAM}
              variant="ban"
            />
            <BrawlerSearchPicker
              label={teamName(match.teamBSlug)}
              selected={ext.brawlerBansB ?? []}
              onChange={(brawlerBansB) => onPatch({ brawlerBansB })}
              banned={[
                ...(parsed.bans?.brawlers_a ?? []),
                ...(parsed.bans?.brawlers_b ?? []),
                ...(ext.brawlerBansA ?? []),
              ]}
              max={MAX_BRAWLER_BANS_PER_TEAM}
              variant="ban"
            />
          </div>
        </div>
      )}

      {slots.map((slot) => (
        <article
          key={`${slot.name}-${slot.index}`}
          className={`bf-map-series-lane ${slot.decisive ? "is-decisive-lane" : ""} ${current === slot.name ? "is-live" : ""}`}
        >
          <header className="bf-map-series-lane-head">
            <MapAssetCard
              name={slot.name}
              variant="order"
              index={slot.index}
              isCurrent={current === slot.name}
              isDecisive={slot.decisive}
              size="lg"
            />
            {slot.decisive && (
              <span className="bf-map-series-decisive-badge">Mapa decisivo</span>
            )}
          </header>

          {showMapWinners && (
            <TeamSidePick
              label={`Ganador · Mapa ${slot.index + 1}`}
              teamASlug={match.teamASlug}
              teamBSlug={match.teamBSlug}
              teamAName={teamName(match.teamASlug)}
              teamBName={teamName(match.teamBSlug)}
              value={ext.mapWinners?.[slot.index] ?? null}
              onChange={(v) => v && setMapWinner(slot.index, v)}
            />
          )}

          {showMapPicks && (
            <div className="bf-map-series-picks">
              <div className="bf-map-series-pick-col">
                <div className="bf-map-series-pick-label">
                  <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={28} />
                  <span>{teamName(match.teamASlug)}</span>
                </div>
                <BrawlerSearchPicker
                  selected={ext.mapBrawlerPicks?.[slot.index]?.a ?? []}
                  onChange={(a) => setMapPicks(slot.index, "a", a)}
                  banned={allBanned}
                  pool={[
                    ...(parsed.brawlers?.meta ?? []),
                    ...(parsed.brawlers?.recommended ?? []),
                  ]}
                />
              </div>
              <div className="bf-map-series-pick-col">
                <div className="bf-map-series-pick-label">
                  <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={28} />
                  <span>{teamName(match.teamBSlug)}</span>
                </div>
                <BrawlerSearchPicker
                  selected={ext.mapBrawlerPicks?.[slot.index]?.b ?? []}
                  onChange={(b) => setMapPicks(slot.index, "b", b)}
                  banned={allBanned}
                  pool={[
                    ...(parsed.brawlers?.meta ?? []),
                    ...(parsed.brawlers?.recommended ?? []),
                  ]}
                />
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
