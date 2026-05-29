"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function bracketTeamShort(slug: string): string {
  const full = teamName(slug);
  if (full.length <= 8) return full;
  const words = full.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((w) => w.slice(0, 3))
      .join(" ")
      .slice(0, 9);
  }
  return full.slice(0, 8);
}

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

function BracketTeamPick({
  slug,
  short,
  selected,
  disabled,
  onClick,
}: {
  slug: string;
  short: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`bf-bracket-pick-team ${selected ? "is-selected" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={teamName(slug)}
      aria-pressed={selected}
    >
      <TeamLogo slug={slug} name="" size={28} glow={selected} />
      <span className="bf-bracket-pick-name">{short}</span>
    </button>
  );
}

function BracketSemiDuel({
  slot,
  label,
  votes,
  saving,
  onVote,
}: {
  slot: PlayoffBracketSlot & { rewardPoints: number };
  label: string;
  votes: Record<string, "A" | "B">;
  saving: boolean;
  onVote: (matchId: string, side: "A" | "B", points: number) => void;
}) {
  if (!slot.teamASlug || !slot.teamBSlug || !slot.matchId) return null;

  const pick = votes[slot.matchId];
  const winner = getBracketPickWinner(slot, votes);

  return (
    <div className="bf-bracket-semi-card">
      <span className="bf-bracket-semi-label">{label}</span>
      <div className="bf-bracket-semi-duel">
        <BracketTeamPick
          slug={slot.teamASlug}
          short={bracketTeamShort(slot.teamASlug)}
          selected={pick === "A"}
          disabled={saving}
          onClick={() => onVote(slot.matchId!, "A", slot.rewardPoints)}
        />
        <span className="bf-bracket-chip-vs">vs</span>
        <BracketTeamPick
          slug={slot.teamBSlug}
          short={bracketTeamShort(slot.teamBSlug)}
          selected={pick === "B"}
          disabled={saving}
          onClick={() => onVote(slot.matchId!, "B", slot.rewardPoints)}
        />
      </div>
      {winner && (
        <p className="bf-bracket-semi-winner">
          Tu pick: <strong>{bracketTeamShort(winner)}</strong>
        </p>
      )}
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
          officialFinal.teamASlug === winner1
            ? side
            : side === "A"
              ? "B"
              : "A";
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
    <div className="bf-bracket-tree">
      <div className="bf-bracket-tree-semis">
        <BracketSemiDuel
          slot={tree.semis[0]}
          label="Semifinal 1"
          votes={votes}
          saving={saving}
          onVote={voteSemi}
        />
        <BracketSemiDuel
          slot={tree.semis[1]}
          label="Semifinal 2"
          votes={votes}
          saving={saving}
          onVote={voteSemi}
        />
      </div>

      <div className="bf-bracket-tree-connectors" aria-hidden>
        <span className="bf-bracket-line" />
        <span className="bf-bracket-line" />
        <span className="bf-bracket-line-h" />
      </div>

      <div className={`bf-bracket-tree-final ${readyFinal ? "is-ready" : ""}`}>
        <span className="bf-bracket-flow-label">Final</span>
        {!readyFinal ? (
          <div className="bf-bracket-final-placeholder">
            <p>Elige el ganador de cada semifinal</p>
            <span className="bf-bracket-final-hint">Los dos equipos aparecerán aquí abajo</span>
          </div>
        ) : (
          <div className="bf-bracket-final-duel">
            <BracketTeamPick
              slug={winner1!}
              short={bracketTeamShort(winner1!)}
              selected={finalPickSide === "A"}
              disabled={saving}
              onClick={() => voteFinal("A")}
            />
            <span className="bf-bracket-chip-vs">vs</span>
            <BracketTeamPick
              slug={winner2!}
              short={bracketTeamShort(winner2!)}
              selected={finalPickSide === "B"}
              disabled={saving}
              onClick={() => voteFinal("B")}
            />
          </div>
        )}
        {readyFinal && !officialFinal && (
          <p className="bf-bracket-final-note">
            Vista previa del cruce — cuando el calendario publique esta final, tu voto se guardará en el
            partido oficial.
          </p>
        )}
        {officialFinal && finalPickSide && (
          <p className="bf-bracket-final-note is-synced">
            Voto guardado en la gran final del torneo.
            <Link href={`/predictions#pick-${officialFinal.matchId}`}> Ver partido</Link>
          </p>
        )}
      </div>

      {err && (
        <p className="bf-bracket-error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}

function BracketDuelChip({ slot }: { slot: PlayoffBracketSlot }) {
  if (slot.status === "tbd" || !slot.teamASlug || !slot.teamBSlug) {
    return (
      <div className="bf-bracket-chip is-tbd" title="Por decidir">
        <span>TBD</span>
      </div>
    );
  }

  return (
    <Link
      href={slot.matchId ? `/predictions#pick-${slot.matchId}` : "/predictions"}
      className="bf-bracket-chip"
      title={`${teamName(slot.teamASlug)} vs ${teamName(slot.teamBSlug)}`}
    >
      <span className="bf-bracket-chip-side">
        <TeamLogo slug={slot.teamASlug} name="" size={20} glow={false} />
        <span className="bf-bracket-chip-name">{bracketTeamShort(slot.teamASlug)}</span>
      </span>
      <span className="bf-bracket-chip-vs">vs</span>
      <span className="bf-bracket-chip-side">
        <TeamLogo slug={slot.teamBSlug} name="" size={20} glow={false} />
        <span className="bf-bracket-chip-name">{bracketTeamShort(slot.teamBSlug)}</span>
      </span>
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
  return (
    <section className="bf-predict-bracket is-compact" aria-labelledby="predict-bracket-title">
      <div className="bf-predict-bracket-head">
        <div>
          <h2 id="predict-bracket-title" className="bf-predict-bracket-title">
            {bracket.layout === "tree" ? "Bracket interactivo" : "Ruta playoff"}
          </h2>
          <p className="bf-predict-bracket-sub">
            {bracket.tournamentName}
            {bracket.region ? ` · ${bracket.region}` : ""}
            {bracket.layout === "tree" && " · Elige semifinales y final"}
          </p>
        </div>
      </div>

      {bracket.quarters && bracket.quarters.length > 0 && (
        <div className="bf-bracket-quarters-row">
          <span className="bf-bracket-flow-label">Cuartos</span>
          <div className="bf-bracket-flow-duels">
            {bracket.quarters.map((slot, i) => (
              <BracketDuelChip key={slot.matchId ?? `qf-${i}`} slot={slot} />
            ))}
          </div>
        </div>
      )}

      {bracket.layout === "tree" && bracket.tree ? (
        <BracketTree tree={bracket.tree} bracket={bracket} votes={votes} events={events} />
      ) : (
        bracket.rounds && (
          <div className="bf-bracket-flow" role="list" aria-label="Fases del bracket">
            {bracket.rounds.map((round, roundIndex) => (
              <div key={round.key} className="bf-bracket-flow-group" role="presentation">
                {roundIndex > 0 && (
                  <span className="bf-bracket-flow-arrow" aria-hidden>
                    →
                  </span>
                )}
                <div className={`bf-bracket-flow-stage is-${round.key}`} role="listitem">
                  <span className="bf-bracket-flow-label">{round.shortTitle}</span>
                  <div className="bf-bracket-flow-duels">
                    {round.slots.map((slot, i) => (
                      <BracketDuelChip key={slot.matchId ?? `${round.key}-${i}`} slot={slot} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );
}
