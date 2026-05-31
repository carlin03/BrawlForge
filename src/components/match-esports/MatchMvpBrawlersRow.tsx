"use client";

import { useState } from "react";
import { LayoutGrid, Users } from "lucide-react";
import { PlayerMvpPicker } from "@/components/match-esports/PlayerMvpPicker";
import { MatchBrawlerStatSidebar } from "@/components/match-esports/MatchBrawlerStatSidebar";
import { PredictionPointBadge } from "@/components/match-esports/PredictionPointBadge";
import type { MatchMeta, MatchPredictionPoints } from "@/lib/data/match-meta";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

export function MatchMvpBrawlersRow({
  match,
  meta,
  ext,
  matchBans,
  points,
  showMvp,
  showWr,
  showMostUsed,
  showMostBanned,
  showLowestWr,
  onPatch,
  disabled,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
  matchBans: string[];
  points: MatchPredictionPoints;
  showMvp: boolean;
  showWr: boolean;
  showMostUsed: boolean;
  showMostBanned: boolean;
  showLowestWr: boolean;
  onPatch: (p: Partial<MatchExtendedPrediction>) => void;
  disabled?: boolean;
}) {
  const [mvpView, setMvpView] = useState<"teams" | "players">("teams");
  const hasBrawlers = showWr || showMostUsed || showMostBanned || showLowestWr;

  if (!showMvp && !hasBrawlers) return null;

  return (
    <div className="bf-match-mvp-brawlers-row">
      {showMvp && (
        <div className="bf-match-mvp-brawlers-mvp">
          <div className="bf-match-mvp-brawlers-head">
            <h4 className="bf-match-predict-subh">
              MVP jugador
              <PredictionPointBadge points={points.mvp} />
            </h4>
            <div className="bf-mvp-view-toggle" role="tablist" aria-label="Vista MVP">
              <button
                type="button"
                role="tab"
                aria-selected={mvpView === "teams"}
                className={`bf-mvp-view-btn ${mvpView === "teams" ? "is-on" : ""}`}
                onClick={() => setMvpView("teams")}
              >
                <LayoutGrid size={14} />
                Equipos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mvpView === "players"}
                className={`bf-mvp-view-btn ${mvpView === "players" ? "is-on" : ""}`}
                onClick={() => setMvpView("players")}
              >
                <Users size={14} />
                Jugadores
              </button>
            </div>
          </div>
          <PlayerMvpPicker
            teamASlug={match.teamASlug}
            teamBSlug={match.teamBSlug}
            value={ext.mvpPlayerSlug ?? null}
            onChange={(slug) => onPatch({ mvpPlayerSlug: slug })}
            disabled={disabled}
            viewMode={mvpView}
          />
        </div>
      )}

      {hasBrawlers && (
        <MatchBrawlerStatSidebar
          match={match}
          meta={meta}
          ext={ext}
          matchBans={matchBans}
          points={points}
          showWr={showWr}
          showMostUsed={showMostUsed}
          showMostBanned={showMostBanned}
          showLowestWr={showLowestWr}
          onPatch={onPatch}
        />
      )}
    </div>
  );
}
