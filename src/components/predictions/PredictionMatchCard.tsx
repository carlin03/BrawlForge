"use client";

import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament, teamName } from "@/lib/data";

interface PredictionMatchCardProps {
  event: PredictionEvent;
  featured?: boolean;
}

export function PredictionMatchCard({ event, featured }: PredictionMatchCardProps) {
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");
  const nameA = teamName(event.teamASlug);
  const nameB = teamName(event.teamBSlug);

  return (
    <div className={`pm-card ${featured ? "pm-card-featured" : ""}`}>
      <div className="pm-card-head">
        <TournamentLogo slug={event.tournamentSlug} name={getPredictionTournament(event)} size={22} />
        <span className="pm-card-event">{getPredictionTournament(event)}</span>
        <span className="pm-card-stage">{event.stage}</span>
        <span className="pm-card-reward c-yellow">+{event.rewardPoints} pts</span>
      </div>

      <div className="pm-card-body">
        <button type="button" className="pm-side">
          <TeamLogo slug={event.teamASlug} name={nameA} size={featured ? 48 : 40} />
          <span className="pm-side-tag">{labelA}</span>
          <div className="pm-bar"><div className="pm-bar-fill pm-bar-blue" style={{ width: `${event.pickAPct}%` }} /></div>
          <span className="pm-pct c-blue">{event.pickAPct}%</span>
        </button>

        <div className="pm-vs">VS</div>

        <button type="button" className="pm-side">
          <TeamLogo slug={event.teamBSlug} name={nameB} size={featured ? 48 : 40} />
          <span className="pm-side-tag">{labelB}</span>
          <div className="pm-bar"><div className="pm-bar-fill pm-bar-red" style={{ width: `${event.pickBPct}%` }} /></div>
          <span className="pm-pct c-red">{event.pickBPct}%</span>
        </button>
      </div>

      <div className="pm-card-foot">
        <span className="nv-dim">{event.totalVotes.toLocaleString()} votos</span>
        <Link href={`/matches/${event.matchId}`} className="pm-link">Ver partido →</Link>
      </div>
    </div>
  );
}
