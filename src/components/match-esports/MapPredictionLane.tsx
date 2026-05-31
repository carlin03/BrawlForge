"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { TeamSidePick } from "@/components/match-esports/TeamSidePick";
import { MapBrawlerDraftRow } from "@/components/match-esports/MapBrawlerDraftRow";
import { resolveMapForMatch } from "@/lib/data/resolve-match-assets";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import { normalizeMapTeamBans } from "@/lib/match-predictions-storage";
import { teamName } from "@/lib/data";
import type { MapSeriesSlot } from "@/lib/data/series-map-utils";
import type { MatchPredictionPoints } from "@/lib/data/match-meta";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import { PredictionPointBadge } from "@/components/match-esports/PredictionPointBadge";

/**
 * Predicción por mapa (lista 1,1,1): cabecera + ganador + draft completo (3+2+3 / bans equipo).
 */
export function MapPredictionLane({
  slot,
  match,
  meta,
  ext,
  mapCurrent,
  showWinner,
  showDraft,
  interactive,
  onMapWinner,
  onPicksA,
  onPicksB,
  onBans,
  onTeamBansA,
  onTeamBansB,
  matchBans,
  points,
}: {
  slot: MapSeriesSlot;
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
  mapCurrent?: string;
  showWinner: boolean;
  showDraft: boolean;
  interactive?: boolean;
  onMapWinner: (side: "A" | "B") => void;
  onPicksA: (picks: string[]) => void;
  onPicksB: (picks: string[]) => void;
  onBans: (bans: string[]) => void;
  onTeamBansA: (bans: string[]) => void;
  onTeamBansB: (bans: string[]) => void;
  matchBans: string[];
  points: MatchPredictionPoints;
}) {
  const { maps: mapCatalog } = useGameAssetsCatalog();
  const mapEntry = resolveMapForMatch(slot.name, meta, mapCatalog);
  const picks = ext.mapBrawlerPicks?.[slot.index];
  const bans = ext.mapBrawlerBans?.[slot.index] ?? [];
  const teamBans = normalizeMapTeamBans(ext)[slot.index] ?? { a: [], b: [] };
  const teamA = teamName(match.teamASlug);
  const teamB = teamName(match.teamBSlug);

  return (
    <article
      className={`bf-map-pred-lane is-full ${slot.decisive ? "is-decisive" : ""} ${mapCurrent === slot.name ? "is-live" : ""}`}
      id={`map-pred-${slot.index}`}
      aria-labelledby={`map-pred-title-${slot.index}`}
    >
      <header className="bf-map-pred-lane-banner" id={`map-pred-title-${slot.index}`}>
        <div className="bf-map-pred-lane-banner-text">
          <span className="bf-map-pred-lane-num">MAPA {slot.index + 1}</span>
          <h3 className="bf-map-pred-lane-name">{slot.name}</h3>
          {mapEntry.mode && (
            <span className="bf-map-pred-mode-tag">{mapEntry.mode}</span>
          )}
          {slot.decisive && (
            <span className="bf-map-pred-decisive-tag">Mapa decisivo</span>
          )}
        </div>
        <div className="bf-map-pred-lane-banner-art">
          <MapAssetCard
            name={slot.name}
            variant="order"
            index={slot.index}
            isDecisive={slot.decisive}
            isCurrent={mapCurrent === slot.name}
            size="lg"
            meta={meta}
          />
        </div>
      </header>

      {showWinner && (
        <section className="bf-map-pred-section is-winner is-side-by-side">
          <h4 className="bf-map-pred-section-label">
            Ganador · Mapa {slot.index + 1}
            <PredictionPointBadge points={points.map_winner} />
          </h4>
          {interactive ? (
            <TeamSidePick
              label=""
              teamASlug={match.teamASlug}
              teamBSlug={match.teamBSlug}
              teamAName={teamA}
              teamBName={teamB}
              value={ext.mapWinners?.[slot.index] ?? null}
              onChange={(v) => v && onMapWinner(v)}
              showVs
              inline
            />
          ) : ext.mapWinners?.[slot.index] ? (
            <p className="bf-map-pred-readonly">
              {teamName(
                ext.mapWinners[slot.index] === "A" ? match.teamASlug : match.teamBSlug,
              )}
            </p>
          ) : (
            <p className="bf-match-predict-hint">—</p>
          )}
        </section>
      )}

      {showDraft && (
        <section className="bf-map-pred-section is-draft">
          <header className="bf-map-pred-draft-head">
            <h4 className="bf-map-pred-section-label">Picks y bloqueos</h4>
            <div className="bf-map-pred-draft-points">
              <PredictionPointBadge label="Pick acertado" points={points.map_pick} />
              <PredictionPointBadge label="Ban acertado" points={points.brawler_ban} />
            </div>
          </header>
          <MapBrawlerDraftRow
            mapIndex={slot.index}
            ext={ext}
            teamAName={teamA}
            teamBName={teamB}
            picksA={picks?.a ?? []}
            picksB={picks?.b ?? []}
            centralBans={bans}
            teamBansA={teamBans.a}
            teamBansB={teamBans.b}
            matchBans={matchBans}
            onPicksA={onPicksA}
            onPicksB={onPicksB}
            onCentralBans={onBans}
            onTeamBansA={onTeamBansA}
            onTeamBansB={onTeamBansB}
            interactive={interactive}
          />
        </section>
      )}
    </article>
  );
}
