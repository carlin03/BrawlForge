"use client";

import { useState } from "react";
import { Clock, Gift } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament } from "@/lib/data/predictions";
import { teamName } from "@/lib/data";

export function ArenaVoteCard({ event, featured }: { event: PredictionEvent; featured?: boolean }) {
  const [pick, setPick] = useState<"A" | "B" | null>(event.userPick ?? null);
  const open = event.status === "open";
  const isFeatured = featured ?? event.featured;

  const diff = Math.max(0, new Date(event.deadline).getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  return (
    <article className={`forge-arena-card ${isFeatured ? "forge-arena-card-featured" : ""}`}>
      <div className="forge-arena-top">
        <span>{getPredictionTournament(event)} · {event.stage}</span>
        {open ? (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {h}h {m}m
          </span>
        ) : (
          <span>CERRADA</span>
        )}
      </div>

      <div className="forge-arena-fight">
        <button
          type="button"
          disabled={!open}
          onClick={() => open && setPick("A")}
          className={`forge-arena-side ${pick === "A" ? "picked-a" : ""}`}
        >
          <TeamLogo slug={event.teamASlug} name={teamName(event.teamASlug)} size={isFeatured ? 96 : 72} />
          <span className="text-center font-bold leading-tight max-w-[140px]">
            {getPredictionLabel(event, "A")}
          </span>
          <span className="forge-arena-pct" style={{ color: "var(--bf-blue)" }}>
            {event.pickAPct}%
          </span>
          {open && (
            <span className="rounded-full bg-[var(--bf-blue)] px-5 py-2 text-xs font-black uppercase text-white">
              Votar
            </span>
          )}
        </button>

        <div className="forge-arena-vs">
          <span className="forge-arena-vs-text">VS</span>
          {isFeatured && (
            <span className="mt-2 text-[10px] font-black uppercase text-[var(--bf-muted)]">Main Event</span>
          )}
        </div>

        <button
          type="button"
          disabled={!open}
          onClick={() => open && setPick("B")}
          className={`forge-arena-side ${pick === "B" ? "picked-b" : ""}`}
        >
          <TeamLogo slug={event.teamBSlug} name={teamName(event.teamBSlug)} size={isFeatured ? 96 : 72} />
          <span className="text-center font-bold leading-tight max-w-[140px]">
            {getPredictionLabel(event, "B")}
          </span>
          <span className="forge-arena-pct" style={{ color: "var(--bf-red)" }}>
            {event.pickBPct}%
          </span>
          {open && (
            <span className="rounded-full bg-[var(--bf-red)] px-5 py-2 text-xs font-black uppercase text-white">
              Votar
            </span>
          )}
        </button>
      </div>

      <div className="forge-arena-bar">
        <div className="forge-arena-bar-a" style={{ width: `${event.pickAPct}%` }} />
        <div className="forge-arena-bar-b" style={{ width: `${event.pickBPct}%` }} />
      </div>

      <div className="forge-arena-foot">
        <span className="flex items-center gap-2 font-bold text-[var(--bf-yellow)]">
          <Gift className="h-4 w-4" />
          +{event.rewardPoints} pts
        </span>
        <span className="text-[var(--bf-muted)]">{event.totalVotes.toLocaleString()} votos</span>
      </div>
    </article>
  );
}
