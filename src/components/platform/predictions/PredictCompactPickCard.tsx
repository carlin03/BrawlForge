"use client";

import Link from "next/link";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { formatPredictMatchTime } from "@/lib/data/predictions-ui";
import { getPredictionLabel } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { MatchStageBadge } from "@/components/platform/predictions/MatchStageBadge";
import { MatchStatusPill } from "@/components/platform/predictions/MatchStatusPill";

export function PredictCompactPickCard({
  event,
  variant = "default",
}: {
  event: EnrichedPrediction;
  variant?: "default" | "closing" | "upset";
}) {
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");
  const hasVotes = hasRealVotes(event);
  const leader = event.pickAPct >= event.pickBPct ? "A" : "B";
  const tier = event.stageMeta?.cardClass ?? "";

  return (
    <Link
      href={`/matches/${event.matchId}`}
      className={`bf-predict-compact-card ${tier} ${variant !== "default" ? `is-${variant}` : ""}`}
    >
      <div className="bf-predict-compact-top">
        <span className="bf-predict-compact-tourney">{event.tournamentShortName}</span>
        {event.stageMeta && <MatchStageBadge meta={event.stageMeta} />}
        {event.displayStatus && <MatchStatusPill status={event.displayStatus} compact />}
      </div>
      <div className="bf-predict-compact-teams">
        <TeamLogo slug={event.teamASlug} name={labelA} size={variant === "closing" ? 40 : 36} />
        <span className="bf-predict-compact-vs">vs</span>
        <TeamLogo slug={event.teamBSlug} name={labelB} size={variant === "closing" ? 40 : 36} />
      </div>
      <div className="bf-predict-compact-body">
        <strong>
          {labelA} vs {labelB}
        </strong>
        <span>
          {hasVotes
            ? `${leader === "A" ? event.pickAPct : event.pickBPct}% favorito · ${event.totalVotes.toLocaleString("es-ES")} votos`
            : "Sin votos aún"}
        </span>
        {variant === "closing" && (
          <span className="bf-predict-compact-time">
            {formatPredictMatchTime(event.matchDate ?? event.deadline)}
          </span>
        )}
      </div>
      <span className="bf-predict-compact-pts">+{event.rewardPoints}</span>
    </Link>
  );
}
