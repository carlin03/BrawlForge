"use client";

import { useState } from "react";
import Link from "next/link";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament, hasCommunityVotes } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

interface InteractiveVoteCardProps {
  event: PredictionEvent;
  featured?: boolean;
  initialPick?: "A" | "B" | null;
}

export function InteractiveVoteCard({ event, featured, initialPick = null }: InteractiveVoteCardProps) {
  const [pick, setPick] = useState<"A" | "B" | null>(initialPick);
  const hasVotes = hasCommunityVotes(event);
  const closed = event.status === "closed";
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");

  return (
    <article className={`bf-vote-card ${featured ? "is-featured" : ""} ${pick ? "has-pick" : ""} ${closed ? "is-closed" : ""}`}>
      <div className="bf-vote-card-glow" aria-hidden />
      <header className="bf-vote-card-head">
        <TournamentLogo slug={event.tournamentSlug} name={getPredictionTournament(event)} size={featured ? 36 : 28} />
        <div>
          <span className="bf-home-eyebrow">{getPredictionTournament(event)}</span>
          <strong>{event.stage}</strong>
        </div>
        <span className="bf-vote-reward">+{event.rewardPoints}</span>
      </header>

      <div className="bf-vote-arena">
        <button
          type="button"
          className={`bf-vote-side ${pick === "A" ? "is-picked" : ""} ${closed && event.correctPick === "A" ? "is-winner" : ""}`}
          onClick={() => !closed && setPick("A")}
          disabled={closed}
        >
          <TeamLogo slug={event.teamASlug} name={labelA} size={featured ? 64 : 48} />
          <span className="bf-vote-name">{labelA}</span>
          {hasVotes && <span className="bf-vote-pct">{event.pickAPct}%</span>}
          {pick === "A" && !closed && <span className="bf-vote-pick-badge">Tu pick</span>}
        </button>

        <div className="bf-vote-vs">
          <span>VS</span>
          {hasVotes && <span className="bf-vote-votes">{(event.totalVotes / 1000).toFixed(1)}K</span>}
        </div>

        <button
          type="button"
          className={`bf-vote-side ${pick === "B" ? "is-picked" : ""} ${closed && event.correctPick === "B" ? "is-winner" : ""}`}
          onClick={() => !closed && setPick("B")}
          disabled={closed}
        >
          <TeamLogo slug={event.teamBSlug} name={labelB} size={featured ? 64 : 48} />
          <span className="bf-vote-name">{labelB}</span>
          {hasVotes && <span className="bf-vote-pct">{event.pickBPct}%</span>}
          {pick === "B" && !closed && <span className="bf-vote-pick-badge">Tu pick</span>}
        </button>
      </div>

      {hasVotes && (
        <div className="bp-poll-bar">
          <div className="bp-poll-bar-a" style={{ width: `${event.pickAPct}%` }} />
          <div className="bp-poll-bar-b" style={{ width: `${event.pickBPct}%` }} />
        </div>
      )}

      <footer className="bf-vote-foot">
        {!closed && !pick && (
          <span className="bf-vote-hint">Toca un equipo para votar — guardaremos tu pick en Supabase pronto</span>
        )}
        {!closed && pick && (
          <span className="bf-vote-confirmed">Voto registrado localmente · {getPredictionLabel(event, pick)}</span>
        )}
        {closed && event.correctPick && (
          <span>Ganador: {getPredictionLabel(event, event.correctPick)}</span>
        )}
        {!SHOW_DEMO_SOCIAL && !pick && !closed && (
          <Link href="/predictions" className="bf-home-link">Ver detalle</Link>
        )}
      </footer>
    </article>
  );
}
