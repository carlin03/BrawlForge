"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament } from "@/lib/data/predictions";
import { getTournament, teamName } from "@/lib/data";

export function PickTicket({
  event,
  featured,
}: {
  event: PredictionEvent;
  featured?: boolean;
}) {
  const [pick, setPick] = useState<"A" | "B" | null>(event.userPick ?? null);
  const open = event.status === "open";
  const won = event.status === "closed" && event.userPick === event.correctPick;
  const lost = event.status === "closed" && event.userPick && event.userPick !== event.correctPick;
  const tournament = getTournament(event.tournamentSlug);

  const diff = Math.max(0, new Date(event.deadline).getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  const logoSize = featured ? 80 : 64;

  return (
    <article
      className={`pr-clash ${featured ? "pr-clash-featured" : ""} ${open ? "pr-clash-open" : "pr-clash-closed"} ${won ? "pr-clash-won" : ""} ${lost ? "pr-clash-lost" : ""}`}
    >
      <div className="pr-clash-top">
        <Link href={`/tournaments/${event.tournamentSlug}`} className="pr-clash-tournament">
          <TournamentLogo slug={event.tournamentSlug} name={getPredictionTournament(event)} size={28} />
          <span>{getPredictionTournament(event)}</span>
          {tournament?.region && <span className="pr-clash-region">{tournament.region}</span>}
        </Link>
        <div className="pr-clash-top-right">
          <span className="pr-clash-stage">{event.stage}</span>
          {open ? (
            <span className="pr-clash-timer">
              <Clock className="h-3.5 w-3.5" />
              {h}h {m}m
            </span>
          ) : (
            <span className="pr-clash-result">
              {won && "✓ Acertaste"}
              {lost && "✗ Fallaste"}
              {!event.userPick && "Cerrado"}
            </span>
          )}
        </div>
      </div>

      <div className="pr-clash-body">
        <button
          type="button"
          disabled={!open}
          onClick={() => open && setPick("A")}
          className={`pr-clash-side pr-clash-side-a ${pick === "A" ? "pr-clash-picked" : ""}`}
        >
          <TeamLogo slug={event.teamASlug} name={teamName(event.teamASlug)} size={logoSize} />
          <span className="pr-clash-team">{getPredictionLabel(event, "A")}</span>
          <span className="pr-clash-pct">{event.pickAPct}%</span>
        </button>

        <div className="pr-clash-vs-block">
          <span className="pr-clash-vs">VS</span>
          <span className="pr-clash-reward">+{event.rewardPoints} pts</span>
        </div>

        <button
          type="button"
          disabled={!open}
          onClick={() => open && setPick("B")}
          className={`pr-clash-side pr-clash-side-b ${pick === "B" ? "pr-clash-picked" : ""}`}
        >
          <TeamLogo slug={event.teamBSlug} name={teamName(event.teamBSlug)} size={logoSize} />
          <span className="pr-clash-team">{getPredictionLabel(event, "B")}</span>
          <span className="pr-clash-pct">{event.pickBPct}%</span>
        </button>
      </div>

      <div className="pr-clash-poll">
        <div className="pr-clash-poll-a" style={{ width: `${event.pickAPct}%` }} />
        <div className="pr-clash-poll-b" style={{ width: `${event.pickBPct}%` }} />
      </div>

      <div className="pr-clash-foot">
        <span className="pr-clash-votes">{event.totalVotes.toLocaleString()} votos</span>
        {pick && open && (
          <span className="pr-clash-confirmed">
            <Check className="h-3.5 w-3.5" />
            Voto registrado
          </span>
        )}
      </div>
    </article>
  );
}
