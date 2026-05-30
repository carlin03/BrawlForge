"use client";

import type { VoteAggregate } from "@/lib/supabase/game-types";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teamName } from "@/lib/data";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";

export function MatchCommunityPulse({
  matchId,
  teamASlug,
  teamBSlug,
  aggregates,
  metaBrawler,
  exactLeader,
}: {
  matchId: string;
  teamASlug: string;
  teamBSlug: string;
  aggregates: Record<string, VoteAggregate>;
  metaBrawler?: string;
  exactLeader?: string | null;
}) {
  const agg = aggregates[matchId];
  const total = agg?.total_votes ?? 0;
  const pctA = total ? Math.round(((agg?.votes_a ?? 0) / total) * 100) : 50;
  const pctB = 100 - pctA;
  const winnerSlug = pctA >= pctB ? teamASlug : teamBSlug;

  return (
    <section className="bf-community-pulse">
      <h3 className="bf-community-pulse-h">Predicciones de la comunidad</h3>
      <div className="bf-community-pulse-grid">
        <div className="bf-community-pulse-item">
          <span className="bf-community-pulse-label">Ganador más votado</span>
          <div className="bf-community-pulse-value">
            <TeamLogo slug={winnerSlug} name={teamName(winnerSlug)} size={36} />
            <strong>{teamName(winnerSlug)}</strong>
            <span>{total ? `${pctA}% · ${pctB}%` : "Sé el primero"}</span>
          </div>
        </div>
        <div className="bf-community-pulse-item">
          <span className="bf-community-pulse-label">Resultado exacto</span>
          <strong className="bf-community-pulse-stat">{exactLeader ?? (total ? "2-1" : "—")}</strong>
          <span className="bf-community-pulse-sub">Tendencia comunidad</span>
        </div>
        {metaBrawler && (
          <div className="bf-community-pulse-item">
            <span className="bf-community-pulse-label">Brawler meta</span>
            <BrawlerAssetIcon name={metaBrawler} size={56} variant="meta" />
          </div>
        )}
      </div>
    </section>
  );
}
