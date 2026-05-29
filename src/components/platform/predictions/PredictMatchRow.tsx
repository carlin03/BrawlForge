"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { formatPredictMatchTime } from "@/lib/data/predictions-ui";
import { getPredictionLabel } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import { TeamLogo } from "@/components/ui/TeamLogo";

/** Fila rápida — enlace al duelo en la lista principal (sin duplicar la card completa). */
export function PredictMatchRow({
  event,
  showTime = false,
  accent,
}: {
  event: EnrichedPrediction;
  showTime?: boolean;
  accent?: "closing" | "upset";
}) {
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");
  const hasVotes = hasRealVotes(event);
  const leaderPct = event.pickAPct >= event.pickBPct ? event.pickAPct : event.pickBPct;
  const time = formatPredictMatchTime(event.matchDate ?? event.deadline);

  return (
    <Link
      href={`/predictions#pick-${event.matchId}`}
      className={`bf-predict-match-row ${accent ? `is-${accent}` : ""}`}
    >
      <div className="bf-predict-row-logos">
        <TeamLogo slug={event.teamASlug} name={labelA} size={40} glow={false} />
        <span className="bf-predict-row-vs">vs</span>
        <TeamLogo slug={event.teamBSlug} name={labelB} size={40} glow={false} />
      </div>

      <div className="bf-predict-row-copy">
        <p className="bf-predict-row-title">
          {labelA} <span>vs</span> {labelB}
        </p>
        <p className="bf-predict-row-sub">
          {event.tournamentShortName ?? event.tournamentSlug}
          {" · "}
          {event.stageMeta?.label ?? event.stage}
          {showTime && (
            <>
              {" · "}
              <time dateTime={event.matchDate ?? event.deadline}>{time}</time>
            </>
          )}
        </p>
      </div>

      <div className="bf-predict-row-end">
        {hasVotes ? (
          <span className="bf-predict-row-pct">{leaderPct}%</span>
        ) : (
          <span className="bf-predict-row-pct is-muted">Votar</span>
        )}
        <span className="bf-predict-row-pts">+{event.rewardPoints}</span>
        <ChevronRight size={16} className="bf-predict-row-chevron" aria-hidden />
      </div>
    </Link>
  );
}
