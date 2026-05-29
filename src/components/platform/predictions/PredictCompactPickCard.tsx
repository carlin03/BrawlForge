"use client";

import Link from "next/link";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { getPredictionLabel } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function PredictCompactPickCard({ event }: { event: EnrichedPrediction }) {
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");
  const hasVotes = hasRealVotes(event);
  const leader = event.pickAPct >= event.pickBPct ? "A" : "B";

  return (
    <Link href={`/matches/${event.matchId}`} className="bf-predict-compact-card">
      <div className="bf-predict-compact-teams">
        <TeamLogo slug={event.teamASlug} name={labelA} size={36} />
        <span className="bf-predict-compact-vs">vs</span>
        <TeamLogo slug={event.teamBSlug} name={labelB} size={36} />
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
      </div>
      <span className="bf-predict-compact-pts">+{event.rewardPoints}</span>
    </Link>
  );
}
