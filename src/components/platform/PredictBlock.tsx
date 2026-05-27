"use client";

import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament, teamName } from "@/lib/data";

interface PredictBlockProps {
  event: PredictionEvent;
}

export function PredictBlock({ event }: PredictBlockProps) {
  return (
    <div className="es-predict">
      <div className="es-predict-q">
        {getPredictionTournament(event)} · {event.stage}
      </div>
      <div className="es-predict-options">
        <button type="button" className="es-predict-opt">
          <TeamLogo slug={event.teamASlug} name={teamName(event.teamASlug)} size={20} />
          {getPredictionLabel(event, "A")}
          <span style={{ color: "var(--es-dim)", fontSize: 10 }}>{event.pickAPct}%</span>
        </button>
        <button type="button" className="es-predict-opt">
          <TeamLogo slug={event.teamBSlug} name={teamName(event.teamBSlug)} size={20} />
          {getPredictionLabel(event, "B")}
          <span style={{ color: "var(--es-dim)", fontSize: 10 }}>{event.pickBPct}%</span>
        </button>
      </div>
      <Link href="/predictions" className="es-panel-link" style={{ display: "inline-block", marginTop: 8 }}>
        +{event.rewardPoints} pts · Votar
      </Link>
    </div>
  );
}
