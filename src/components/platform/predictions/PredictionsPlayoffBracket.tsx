"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BracketVoteArena } from "@/components/platform/predictions/BracketVoteArena";
import type {
  EnrichedPrediction,
  PlayoffBracketSlot,
  PlayoffBracketTree,
  PlayoffBracketView,
} from "@/lib/data/predictions-ui";
import {
  findBracketFinalEvent,
  getBracketPickWinner,
} from "@/lib/data/predictions-ui";
import { teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

type BracketDraftPick = { teamA: string; teamB: string; pick: "A" | "B" };

function bracketDraftKey(tournamentSlug: string): string {
  return `bf-bracket-final:${tournamentSlug}`;
}

function readBracketDraft(tournamentSlug: string): BracketDraftPick | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(bracketDraftKey(tournamentSlug));
    if (!raw) return null;
    return JSON.parse(raw) as BracketDraftPick;
  } catch {
    return null;
  }
}

function writeBracketDraft(tournamentSlug: string, data: BracketDraftPick | null) {
  if (typeof window === "undefined") return;
  const key = bracketDraftKey(tournamentSlug);
  if (!data) sessionStorage.removeItem(key);
  else sessionStorage.setItem(key, JSON.stringify(data));
}

function findEvent(events: EnrichedPrediction[], matchId?: string): EnrichedPrediction | undefined {
  if (!matchId) return undefined;
  return events.find((e) => e.matchId === matchId);
}

function BracketSemiDuel({
  slot,
  label,
  votes,
  events,
  saving,
  onVote,
}: {
  slot: PlayoffBracketSlot & { rewardPoints: number };
  label: string;
  votes: Record<string, "A" | "B">;
  events: EnrichedPrediction[];
  saving: boolean;
  onVote: (matchId: string, side: "A" | "B", points: number) => void;
}) {
  if (!slot.teamASlug || !slot.teamBSlug || !slot.matchId) return null;

  const pick = votes[slot.matchId] ?? null;
  const event = findEvent(events, slot.matchId);

  return (
    <div className="bf-bracket-duel is-semi">
      <span className="bf-bracket-duel-tag">{label}</span>
      <BracketVoteArena
        size="semi"
        teamASlug={slot.teamASlug}
        teamBSlug={slot.teamBSlug}
        pick={pick}
        event={event}
        disabled={saving}
        onVoteA={() => onVote(slot.matchId!, "A", slot.rewardPoints)}
        onVoteB={() => onVote(slot.matchId!, "B", slot.rewardPoints)}
      />
    </div>
  );
}

function BracketTree({
  tree,
  bracket,
  votes,
  events,
}: {
  tree: PlayoffBracketTree;
  bracket: PlayoffBracketView;
  votes: Record<string, "A" | "B">;
  events: EnrichedPrediction[];
}) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { castVote } = useGame();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [draftFinal, setDraftFinal] = useState<BracketDraftPick | null>(null);

  const winner1 = getBracketPickWinner(tree.semis[0], votes);
  const winner2 = getBracketPickWinner(tree.semis[1], votes);
  const readyFinal = Boolean(winner1 && winner2);

  const officialFinal = useMemo(() => {
    if (!winner1 || !winner2) return null;
    return findBracketFinalEvent(events, bracket.tournamentSlug, winner1, winner2);
  }, [events, bracket.tournamentSlug, winner1, winner2]);

  const finalEvent = officialFinal ?? undefined;

  useEffect(() => {
    if (!winner1 || !winner2) {
      setDraftFinal(null);
      writeBracketDraft(bracket.tournamentSlug, null);
      return;
    }
    const stored = readBracketDraft(bracket.tournamentSlug);
    if (
      stored &&
      stored.teamA === winner1 &&
      stored.teamB === winner2 &&
      (stored.pick === "A" || stored.pick === "B")
    ) {
      setDraftFinal(stored);
    } else {
      setDraftFinal(null);
      writeBracketDraft(bracket.tournamentSlug, null);
    }
  }, [bracket.tournamentSlug, winner1, winner2]);

  const finalPickSide = useMemo((): "A" | "B" | null => {
    if (!winner1 || !winner2) return null;
    if (officialFinal) {
      const pick = votes[officialFinal.matchId];
      if (!pick) return draftFinal?.pick ?? null;
      const pickedSlug = pick === "A" ? officialFinal.teamASlug : officialFinal.teamBSlug;
      if (pickedSlug === winner1) return "A";
      if (pickedSlug === winner2) return "B";
      return null;
    }
    return draftFinal?.pick ?? null;
  }, [officialFinal, votes, winner1, winner2, draftFinal]);

  const voteSemi = useCallback(
    async (matchId: string, side: "A" | "B", points: number) => {
      if (saving) return;
      if (!isLoggedIn) {
        router.push("/login?next=/predictions");
        return;
      }
      setErr("");
      setSaving(true);
      const res = await castVote(matchId, side, points);
      setSaving(false);
      if (res.error) setErr(res.error);
    },
    [saving, isLoggedIn, router, castVote],
  );

  const voteFinal = useCallback(
    async (side: "A" | "B") => {
      if (!winner1 || !winner2 || saving) return;
      if (!isLoggedIn) {
        router.push("/login?next=/predictions");
        return;
      }
      setErr("");

      if (officialFinal) {
        const apiSide: "A" | "B" =
          officialFinal.teamASlug === winner1 ? side : side === "A" ? "B" : "A";
        setSaving(true);
        const res = await castVote(officialFinal.matchId, apiSide, officialFinal.rewardPoints);
        setSaving(false);
        if (res.error) setErr(res.error);
        return;
      }

      const draft: BracketDraftPick = { teamA: winner1, teamB: winner2, pick: side };
      setDraftFinal(draft);
      writeBracketDraft(bracket.tournamentSlug, draft);
    },
    [winner1, winner2, saving, isLoggedIn, router, officialFinal, castVote, bracket.tournamentSlug],
  );

  return (
    <div className="bf-bracket-pyramid">
      <div className="bf-bracket-row is-semis">
        <BracketSemiDuel
          slot={tree.semis[0]}
          label="Semifinal 1"
          votes={votes}
          events={events}
          saving={saving}
          onVote={voteSemi}
        />
        <BracketSemiDuel
          slot={tree.semis[1]}
          label="Semifinal 2"
          votes={votes}
          events={events}
          saving={saving}
          onVote={voteSemi}
        />
      </div>

      <div className="bf-bracket-tree-connectors" aria-hidden>
        <span className="bf-bracket-line" />
        <span className="bf-bracket-line" />
        <span className="bf-bracket-line-h" />
      </div>

      <div className="bf-bracket-row is-final">
        <div className={`bf-bracket-duel is-final ${readyFinal ? "is-ready" : "is-waiting"}`}>
          <span className="bf-bracket-duel-tag is-gold">Gran final</span>
          {!readyFinal ? (
            <div className="bf-vote-arena bf-bracket-vote-arena is-final is-placeholder">
              <div className="bf-vote-side bf-vote-side-a is-ghost">
                <span className="bf-vote-side-tag bf-vote-side-tag-a">AZUL</span>
                <span className="bf-bracket-ghost-mark">?</span>
                <span className="bf-vote-name">Ganador SF1</span>
              </div>
              <div className="bf-vote-vs">
                <span className="bf-vote-vs-label">VS</span>
                <span className="bf-vote-votes">Elige las semis</span>
              </div>
              <div className="bf-vote-side bf-vote-side-b is-ghost">
                <span className="bf-vote-side-tag bf-vote-side-tag-b">ROJO</span>
                <span className="bf-bracket-ghost-mark">?</span>
                <span className="bf-vote-name">Ganador SF2</span>
              </div>
            </div>
          ) : (
            <BracketVoteArena
              size="final"
              teamASlug={winner1!}
              teamBSlug={winner2!}
              pick={finalPickSide}
              event={finalEvent}
              disabled={saving}
              onVoteA={() => void voteFinal("A")}
              onVoteB={() => void voteFinal("B")}
            />
          )}
        </div>
      </div>

      {readyFinal && !officialFinal && (
        <p className="bf-bracket-final-note">
          Vista previa del cruce — si coincide con la gran final del calendario, tu voto se sincroniza
          automáticamente.
        </p>
      )}
      {officialFinal && finalPickSide && (
        <p className="bf-bracket-final-note is-synced">
          Voto guardado en la gran final.
          <Link href={`/predictions#pick-${officialFinal.matchId}`}> Ver partido</Link>
        </p>
      )}

      {err && (
        <p className="bf-bracket-error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}

/** Cuartos: arena mini con el mismo VS central */
function BracketQuarterDuel({ event }: { event: EnrichedPrediction }) {
  return (
    <Link
      href={`/predictions#pick-${event.matchId}`}
      className="bf-bracket-duel is-quarter"
      title={`${teamName(event.teamASlug)} vs ${teamName(event.teamBSlug)}`}
    >
      <span className="bf-bracket-duel-tag">Cuartos</span>
      <div className="bf-vote-arena bf-bracket-vote-arena is-quarter">
        <div className="bf-vote-side bf-vote-side-a is-link">
          <span className="bf-vote-side-logo">
            <TeamLogo slug={event.teamASlug} name="" size={36} glow={false} />
          </span>
          <span className="bf-vote-name">{teamName(event.teamASlug)}</span>
        </div>
        <div className="bf-vote-vs">
          <span className="bf-vote-vs-label">VS</span>
        </div>
        <div className="bf-vote-side bf-vote-side-b is-link">
          <span className="bf-vote-side-logo">
            <TeamLogo slug={event.teamBSlug} name="" size={36} glow={false} />
          </span>
          <span className="bf-vote-name">{teamName(event.teamBSlug)}</span>
        </div>
      </div>
    </Link>
  );
}

export function PredictionsPlayoffBracket({
  bracket,
  votes,
  events,
}: {
  bracket: PlayoffBracketView;
  votes: Record<string, "A" | "B">;
  events: EnrichedPrediction[];
}) {
  const quarterEvents = useMemo(() => {
    if (!bracket.quarters?.length) return [];
    return bracket.quarters
      .map((s) => findEvent(events, s.matchId))
      .filter((e): e is EnrichedPrediction => Boolean(e));
  }, [bracket.quarters, events]);

  return (
    <section
      className="bf-predict-bracket is-compact is-arena-style"
      aria-labelledby="predict-bracket-title"
    >
      <div className="bf-predict-bracket-head">
        <div>
          <h2 id="predict-bracket-title" className="bf-predict-bracket-title">
            Bracket interactivo
          </h2>
          <p className="bf-predict-bracket-sub">
            {bracket.tournamentName}
            {bracket.region ? ` · ${bracket.region}` : ""}
            {" · 2 semifinales + gran final"}
          </p>
        </div>
      </div>

      {quarterEvents.length > 0 && (
        <div className="bf-bracket-row is-quarters">
          {quarterEvents.map((e) => (
            <BracketQuarterDuel key={e.matchId} event={e} />
          ))}
        </div>
      )}

      {bracket.layout === "tree" && bracket.tree ? (
        <BracketTree tree={bracket.tree} bracket={bracket} votes={votes} events={events} />
      ) : (
        bracket.rounds && (
          <p className="bf-bracket-final-note">Usa los partidos de la lista para votar esta fase.</p>
        )
      )}
    </section>
  );
}
