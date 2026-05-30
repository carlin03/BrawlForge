"use client";

import { useMemo } from "react";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import {
  type BracketRevealState,
  isBracketReadyToVote,
} from "@/lib/data/bracket-reveal";

function displayPickFromVotes(
  event: EnrichedPrediction,
  reveal: BracketRevealState,
  votes: Record<string, "A" | "B">,
): "A" | "B" | null {
  const api = votes[event.matchId] ?? event.userPick;
  if (!api || !isBracketReadyToVote(reveal)) return null;
  const officialSlug = api === "A" ? event.teamASlug : event.teamBSlug;
  if (reveal.sideA.teamSlug && officialSlug === reveal.sideA.teamSlug) return "A";
  if (reveal.sideB.teamSlug && officialSlug === reveal.sideB.teamSlug) return "B";
  return null;
}

export function BracketMatchCard({
  event,
  votes,
  bracketReveal,
  featured,
  voteOverride,
}: {
  event: EnrichedPrediction;
  votes: Record<string, "A" | "B">;
  bracketReveal?: BracketRevealState;
  featured?: boolean;
  voteOverride?: (side: "A" | "B") => Promise<{ error?: string } | void>;
}) {
  const initialPick = useMemo(() => {
    if (!bracketReveal) return event.userPick ?? votes[event.matchId] ?? null;
    return displayPickFromVotes(event, bracketReveal, votes) ?? null;
  }, [event, bracketReveal, votes]);

  const cardKey = bracketReveal
    ? `${event.matchId}-${revealKey(bracketReveal)}`
    : event.matchId;

  return (
    <InteractiveVoteCard
      key={cardKey}
      event={event}
      featured={featured}
      bracketReveal={bracketReveal}
      initialPick={initialPick}
      voteOverride={voteOverride}
    />
  );
}

function revealKey(r: BracketRevealState): string {
  return `${r.sideA.teamSlug ?? "-"}-${r.sideB.teamSlug ?? "-"}`;
}
