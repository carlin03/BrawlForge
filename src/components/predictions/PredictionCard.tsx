"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Gift, Trophy, Zap } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament, userPredictorProfile } from "@/lib/data/predictions";
import { teamName } from "@/lib/data";

function CountdownBadge({ deadline }: { deadline: string }) {
  const diff = new Date(deadline).getTime() - Date.now();
  const hours = Math.max(0, Math.floor(diff / 3600000));
  const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));

  return (
    <div className="pred-countdown">
      <Clock className="h-3.5 w-3.5" />
      {hours}h {mins}m left
    </div>
  );
}

interface PredictionCardProps {
  event: PredictionEvent;
}

export function PredictionCard({ event }: PredictionCardProps) {
  const [pick, setPick] = useState<"A" | "B" | null>(event.userPick ?? null);
  const isOpen = event.status === "open";
  const voted = pick !== null;

  return (
    <article className={`pred-card ${event.featured ? "pred-card-featured" : ""}`}>
      {event.featured && (
        <div className="pred-featured-tag">
          <Zap className="h-3 w-3" />
          Featured match
        </div>
      )}

      <div className="pred-card-header">
        <TournamentLogo slug={event.tournamentSlug} name="" size={24} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {getPredictionTournament(event)}
          </div>
          <div className="text-sm font-semibold text-text-secondary">{event.stage}</div>
        </div>
        {isOpen ? (
          <CountdownBadge deadline={event.deadline} />
        ) : (
          <span className="rounded-md bg-bg-hover px-2 py-1 text-[10px] font-bold uppercase text-text-muted">
            Closed
          </span>
        )}
      </div>

      {/* VS layout — big logos */}
      <div className="pred-vs">
        <button
          type="button"
          disabled={!isOpen}
          onClick={() => isOpen && setPick("A")}
          className={`pred-team-side ${pick === "A" ? "pred-team-picked pred-team-picked-a" : ""} ${!isOpen && event.correctPick === "A" ? "pred-team-correct" : ""}`}
        >
          <TeamLogo slug={event.teamASlug} name={teamName(event.teamASlug)} size="xl" />
          <span className="pred-team-name">{getPredictionLabel(event, "A")}</span>
          <span className="pred-team-pct">{event.pickAPct}%</span>
        </button>

        <div className="pred-vs-divider">
          <span className="font-display text-lg font-bold text-text-muted">VS</span>
        </div>

        <button
          type="button"
          disabled={!isOpen}
          onClick={() => isOpen && setPick("B")}
          className={`pred-team-side ${pick === "B" ? "pred-team-picked pred-team-picked-b" : ""} ${!isOpen && event.correctPick === "B" ? "pred-team-correct" : ""}`}
        >
          <TeamLogo slug={event.teamBSlug} name={teamName(event.teamBSlug)} size="xl" />
          <span className="pred-team-name">{getPredictionLabel(event, "B")}</span>
          <span className="pred-team-pct">{event.pickBPct}%</span>
        </button>
      </div>

      {/* Community bar */}
      <div className="pred-community-bar">
        <div className="pred-bar-a" style={{ width: `${event.pickAPct}%` }} />
        <div className="pred-bar-b" style={{ width: `${event.pickBPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-semibold text-text-muted">
        <span>{event.pickAPct}% community</span>
        <span>{event.totalVotes.toLocaleString()} votes</span>
        <span>{event.pickBPct}% community</span>
      </div>

      {/* Actions / rewards */}
      <div className="pred-card-footer">
        <div className="flex items-center gap-3">
          <div className="pred-reward">
            <Gift className="h-4 w-4 text-accent-yellow" />
            <span>+{event.rewardPoints} pts</span>
          </div>
          {!isOpen && event.userPick && (
            <span className={`text-[11px] font-bold ${event.userPick === event.correctPick ? "text-accent-success" : "text-accent-red"}`}>
              {event.userPick === event.correctPick ? "✓ Correct!" : "✗ Wrong pick"}
            </span>
          )}
        </div>

        {isOpen ? (
          voted ? (
            <span className="btn-voted">Pick locked in</span>
          ) : (
            <span className="text-[11px] text-text-muted">Tap a team to vote</span>
          )
        ) : (
          <Link href={`/matches/${event.matchId}`} className="btn-pred-outline">
            View result
          </Link>
        )}
      </div>
    </article>
  );
}

export function PredictorProgress() {
  const { totalPoints, rank, streak, accuracy, nextRewardTier } = userPredictorProfile;
  const progress = (totalPoints / nextRewardTier) * 100;

  return (
    <div className="pred-progress-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent-yellow" />
            <span className="font-display text-lg font-bold">Your Predictor Profile</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Vote on matches · Earn points · Climb the board</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-accent-yellow">{totalPoints}</div>
            <div className="text-[10px] uppercase text-text-muted">Points</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-accent-blue">#{rank}</div>
            <div className="text-[10px] uppercase text-text-muted">Rank</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-accent-red">{streak}W</div>
            <div className="text-[10px] uppercase text-text-muted">Streak</div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-text-muted">Next reward tier — {accuracy}% accuracy</span>
          <span className="font-semibold text-accent-yellow">{totalPoints} / {nextRewardTier}</span>
        </div>
        <div className="pred-tier-track">
          <div className="pred-tier-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
