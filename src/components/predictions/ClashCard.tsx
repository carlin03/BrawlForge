"use client";

import { useState } from "react";
import { Clock, Gift } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament } from "@/lib/data/predictions";
import { teamName } from "@/lib/data";

export function ClashCard({ event, featured }: { event: PredictionEvent; featured?: boolean }) {
  const [pick, setPick] = useState<"A" | "B" | null>(event.userPick ?? null);
  const open = event.status === "open";
  const isFeatured = featured ?? event.featured;

  const diff = Math.max(0, new Date(event.deadline).getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const logoSize = isFeatured ? 100 : 80;

  return (
    <article
      className={`px-clash ${isFeatured ? "px-clash-featured" : ""} ${!open ? "px-clash-closed" : ""}`}
    >
      <div className="px-clash-meta">
        <span>{getPredictionTournament(event)} · {event.stage}</span>
        {open ? (
          <span className="px-clash-meta-live">
            <Clock className="h-3.5 w-3.5" />
            {h}h {m}m
          </span>
        ) : (
          <span>Finalizado</span>
        )}
      </div>

      <div className="px-clash-stage">
        <button
          type="button"
          disabled={!open}
          onClick={() => open && setPick("A")}
          className={`px-clash-team px-clash-team-a ${pick === "A" ? "px-picked" : ""}`}
        >
          <TeamLogo slug={event.teamASlug} name={teamName(event.teamASlug)} size={logoSize} />
          <span className="px-clash-name">{getPredictionLabel(event, "A")}</span>
          <span className="px-clash-pct" style={{ color: "var(--bf-blue)" }}>
            {event.pickAPct}%
          </span>
          {open && (
            <span className="px-clash-vote-btn px-clash-vote-a">Votar</span>
          )}
        </button>

        <div className="px-clash-center">
          <span className="px-clash-vs">VS</span>
          {isFeatured && (
            <span className="mt-2 text-[9px] font-black uppercase text-[var(--bf-red)]">Main Event</span>
          )}
        </div>

        <button
          type="button"
          disabled={!open}
          onClick={() => open && setPick("B")}
          className={`px-clash-team px-clash-team-b ${pick === "B" ? "px-picked" : ""}`}
        >
          <TeamLogo slug={event.teamBSlug} name={teamName(event.teamBSlug)} size={logoSize} />
          <span className="px-clash-name">{getPredictionLabel(event, "B")}</span>
          <span className="px-clash-pct" style={{ color: "var(--bf-red)" }}>
            {event.pickBPct}%
          </span>
          {open && (
            <span className="px-clash-vote-btn px-clash-vote-b">Votar</span>
          )}
        </button>
      </div>

      <div className="px-clash-bar">
        <div className="px-clash-bar-a" style={{ width: `${event.pickAPct}%` }} />
        <div className="px-clash-bar-b" style={{ width: `${event.pickBPct}%` }} />
      </div>

      <div className="px-clash-foot">
        <span className="px-clash-reward flex items-center gap-2">
          <Gift className="h-4 w-4" />
          +{event.rewardPoints} pts
        </span>
        <span className="px-clash-votes">{event.totalVotes.toLocaleString()} votos</span>
      </div>
    </article>
  );
}
