"use client";

import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { formatPredictMatchTime, tournamentLabel } from "@/lib/data/predictions-ui";
import { getPredictionLabel } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function MyPredictionRow({ event }: { event: EnrichedPrediction }) {
  const pickLabel = event.userPick ? getPredictionLabel(event, event.userPick) : "—";
  const status =
    event.outcome === "hit" ? (
      <span className="bf-my-predict-status is-hit">
        <Check size={12} aria-hidden /> Acertado +{event.pointsEarned}
      </span>
    ) : event.outcome === "miss" ? (
      <span className="bf-my-predict-status is-miss">
        <X size={12} aria-hidden /> Fallado
      </span>
    ) : event.outcome === "pending" ? (
      <span className="bf-my-predict-status is-pending">
        <Clock size={12} aria-hidden /> Pendiente
      </span>
    ) : null;

  return (
    <Link href={`/matches/${event.matchId}`} className="bf-my-predict-row">
      <div className="bf-my-predict-teams">
        <TeamLogo slug={event.teamASlug} name="" size={32} glow={false} />
        <span className="bf-my-predict-vs">vs</span>
        <TeamLogo slug={event.teamBSlug} name="" size={32} glow={false} />
      </div>
      <div className="bf-my-predict-body">
        <strong>
          {getPredictionLabel(event, "A")} vs {getPredictionLabel(event, "B")}
        </strong>
        <span>
          {tournamentLabel(event)} · Tu pick: {pickLabel}
        </span>
      </div>
      <div className="bf-my-predict-end">
        {status}
        <span className="bf-my-predict-date">{formatPredictMatchTime(event.matchDate ?? event.deadline)}</span>
      </div>
    </Link>
  );
}
