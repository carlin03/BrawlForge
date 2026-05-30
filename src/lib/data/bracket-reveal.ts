import type { EnrichedPrediction } from "./predictions-ui";
import { getBracketPickWinner, type PlayoffBracketSlot } from "./predictions-ui";

export type BracketSideState = {
  revealed: boolean;
  teamSlug: string | null;
};

export type BracketRevealState = {
  sideA: BracketSideState;
  sideB: BracketSideState;
};

function slotWinner(slot: PlayoffBracketSlot, votes: Record<string, "A" | "B">): string | null {
  return getBracketPickWinner(slot, votes);
}

export function quarterWinner(
  qf: EnrichedPrediction,
  votes: Record<string, "A" | "B">,
): string | null {
  return slotWinner(
    {
      matchId: qf.matchId,
      teamASlug: qf.teamASlug,
      teamBSlug: qf.teamBSlug,
      status: "set",
    },
    votes,
  );
}

/** Semis: cada lado se desbloquea al votar el cuarto que lo alimenta (2+2 → 2 semis). */
export function resolveSemiReveal(
  semiIndex: number,
  semi: EnrichedPrediction,
  quarters: EnrichedPrediction[],
  votes: Record<string, "A" | "B">,
): BracketRevealState {
  const qfA = quarters[semiIndex * 2];
  const qfB = quarters[semiIndex * 2 + 1];

  if (!qfA || !qfB) {
    return {
      sideA: { revealed: true, teamSlug: semi.teamASlug },
      sideB: { revealed: true, teamSlug: semi.teamBSlug },
    };
  }

  const winA = quarterWinner(qfA, votes);
  const winB = quarterWinner(qfB, votes);

  return {
    sideA: { revealed: !!winA, teamSlug: winA },
    sideB: { revealed: !!winB, teamSlug: winB },
  };
}

/** Ganador de una semi según el pick del usuario y los equipos mostrados. */
export function semiWinner(
  semi: EnrichedPrediction,
  reveal: BracketRevealState,
  votes: Record<string, "A" | "B">,
): string | null {
  const pick = votes[semi.matchId];
  if (!pick || !reveal.sideA.revealed || !reveal.sideB.revealed) return null;
  const slugA = reveal.sideA.teamSlug;
  const slugB = reveal.sideB.teamSlug;
  if (!slugA || !slugB) return null;
  return pick === "A" ? slugA : slugB;
}

/** Gran final: ambos lados dependen de las dos semis. */
export function resolveFinalReveal(
  semis: EnrichedPrediction[],
  quarters: EnrichedPrediction[],
  votes: Record<string, "A" | "B">,
): BracketRevealState {
  if (semis.length < 2) {
    const only = semis[0];
    return only
      ? {
          sideA: { revealed: true, teamSlug: only.teamASlug },
          sideB: { revealed: true, teamSlug: only.teamBSlug },
        }
      : { sideA: { revealed: false, teamSlug: null }, sideB: { revealed: false, teamSlug: null } };
  }

  const r0 = resolveSemiReveal(0, semis[0], quarters, votes);
  const r1 = resolveSemiReveal(1, semis[1], quarters, votes);
  const w0 = semiWinner(semis[0], r0, votes);
  const w1 = semiWinner(semis[1], r1, votes);

  return {
    sideA: { revealed: !!w0, teamSlug: w0 },
    sideB: { revealed: !!w1, teamSlug: w1 },
  };
}

/** Mapea voto en el lado mostrado (slug) al lado A/B del partido oficial en API. */
export function mapBracketSlugToApiSide(
  event: { teamASlug: string; teamBSlug: string },
  pickedSlug: string,
): "A" | "B" | null {
  if (event.teamASlug === pickedSlug) return "A";
  if (event.teamBSlug === pickedSlug) return "B";
  return null;
}

export function isBracketReadyToVote(reveal: BracketRevealState): boolean {
  return reveal.sideA.revealed && reveal.sideB.revealed;
}
