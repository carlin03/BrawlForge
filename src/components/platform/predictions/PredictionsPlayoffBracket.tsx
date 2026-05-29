"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import type { EnrichedPrediction, PlayoffBracketView } from "@/lib/data/predictions-ui";
import {
  findBracketFinalEvent,
  getBracketPickWinner,
} from "@/lib/data/predictions-ui";
import { DEFAULT_PICKEM_STAGE_POINTS, getPickemRewardPoints } from "@/lib/data/pickem-reward-points";
import { getMatchStageMeta } from "@/lib/data/match-stage-meta";
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

function winnerFromEvent(event: EnrichedPrediction, votes: Record<string, "A" | "B">): string | null {
  return getBracketPickWinner(
    {
      matchId: event.matchId,
      teamASlug: event.teamASlug,
      teamBSlug: event.teamBSlug,
      status: "set",
    },
    votes,
  );
}

function BracketFinalBlock({
  bracket,
  votes,
  events,
}: {
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

  const needTwoSemis = bracket.semis.length >= 2;
  const winner1 = bracket.semis[0] ? winnerFromEvent(bracket.semis[0], votes) : null;
  const winner2 = bracket.semis[1] ? winnerFromEvent(bracket.semis[1], votes) : null;
  const readyFromSemis = needTwoSemis ? Boolean(winner1 && winner2) : Boolean(winner1 || winner2);

  const officialFinal = useMemo(() => {
    if (needTwoSemis) {
      if (!winner1 || !winner2) return bracket.final ?? null;
      return (
        findBracketFinalEvent(events, bracket.tournamentSlug, winner1, winner2) ?? bracket.final ?? null
      );
    }
    return bracket.final ?? null;
  }, [bracket, events, needTwoSemis, winner1, winner2]);

  const displayWinners = useMemo(() => {
    if (needTwoSemis && winner1 && winner2) return { a: winner1, b: winner2 };
    if (!needTwoSemis && bracket.final) {
      return { a: bracket.final.teamASlug, b: bracket.final.teamBSlug };
    }
    if (!needTwoSemis && winner1 && bracket.semis[0]) {
      const other =
        winner1 === bracket.semis[0].teamASlug
          ? bracket.semis[0].teamBSlug
          : bracket.semis[0].teamASlug;
      return { a: winner1, b: other };
    }
    return null;
  }, [needTwoSemis, winner1, winner2, bracket]);

  useEffect(() => {
    if (!displayWinners) {
      setDraftFinal(null);
      writeBracketDraft(bracket.tournamentSlug, null);
      return;
    }
    const stored = readBracketDraft(bracket.tournamentSlug);
    if (
      stored &&
      stored.teamA === displayWinners.a &&
      stored.teamB === displayWinners.b &&
      (stored.pick === "A" || stored.pick === "B")
    ) {
      setDraftFinal(stored);
    } else {
      setDraftFinal(null);
    }
  }, [bracket.tournamentSlug, displayWinners]);

  const finalEvent = useMemo((): EnrichedPrediction | null => {
    if (!displayWinners) return null;

    const pts = getPickemRewardPoints("Grand Final", "Bo5", DEFAULT_PICKEM_STAGE_POINTS);
    const base = officialFinal ?? bracket.final;

    if (base && base.teamASlug === displayWinners.a && base.teamBSlug === displayWinners.b) {
      return base;
    }
    if (base && base.teamASlug === displayWinners.b && base.teamBSlug === displayWinners.a) {
      return { ...base, teamASlug: displayWinners.a, teamBSlug: displayWinners.b };
    }

    const pick = draftFinal?.pick ?? null;
    const userPick =
      officialFinal && votes[officialFinal.matchId]
        ? votes[officialFinal.matchId] ===
          (officialFinal.teamASlug === displayWinners.a ? "A" : "B")
          ? ("A" as const)
          : ("B" as const)
        : pick;

    return {
      id: `bracket-final-${bracket.tournamentSlug}`,
      matchId: officialFinal?.matchId ?? `bracket-preview-${bracket.tournamentSlug}`,
      teamASlug: displayWinners.a,
      teamBSlug: displayWinners.b,
      pickAPct: base?.pickAPct ?? 50,
      pickBPct: base?.pickBPct ?? 50,
      totalVotes: base?.totalVotes ?? 0,
      rewardPoints: pts,
      featured: true,
      userPick: userPick ?? null,
      status: "open",
      stage: "Grand Final",
      tournamentSlug: bracket.tournamentSlug,
      deadline: base?.deadline ?? bracket.semis[0]?.deadline ?? new Date().toISOString(),
      stageMeta: getMatchStageMeta("Grand Final"),
      displayStatus: "upcoming",
      tournamentShortName: bracket.tournamentName,
      region: bracket.region,
      outcome: userPick ? "pending" : "none",
      pointsEarned: 0,
    };
  }, [displayWinners, officialFinal, bracket, votes, draftFinal]);

  const voteFinalOverride = useCallback(
    async (side: "A" | "B") => {
      if (!displayWinners || saving) return;
      if (!isLoggedIn) {
        router.push("/login?next=/predictions");
        return;
      }
      setErr("");

      if (officialFinal) {
        const apiSide: "A" | "B" =
          officialFinal.teamASlug === displayWinners.a
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

      const draft: BracketDraftPick = {
        teamA: displayWinners.a,
        teamB: displayWinners.b,
        pick: side,
      };
      setDraftFinal(draft);
      writeBracketDraft(bracket.tournamentSlug, draft);
    },
    [displayWinners, saving, isLoggedIn, router, officialFinal, castVote, bracket.tournamentSlug],
  );

  const showPlaceholder = needTwoSemis && !readyFromSemis;

  return (
    <div className="bf-predict-bracket-final-block">
      <h3 className="bf-predict-bracket-phase-title is-gold">Gran final</h3>
      {showPlaceholder ? (
        <article className="bf-vote-card bf-bsc-vote-card is-tier-5 is-bracket-waiting">
          <div className="bf-bsc-vote-stripe" aria-hidden />
          <p className="bf-predict-bracket-waiting-msg">
            Elige el ganador de cada semifinal. Los dos equipos bajarán aquí para la gran final.
          </p>
          <div className="bf-vote-arena">
            <div className="bf-vote-side bf-vote-side-a is-ghost">
              <span className="bf-vote-side-tag bf-vote-side-tag-a">AZUL</span>
              <span className="bf-vote-name">SF1</span>
            </div>
            <div className="bf-vote-vs">
              <span className="bf-vote-vs-label">VS</span>
            </div>
            <div className="bf-vote-side bf-vote-side-b is-ghost">
              <span className="bf-vote-side-tag bf-vote-side-tag-b">ROJO</span>
              <span className="bf-vote-name">SF2</span>
            </div>
          </div>
        </article>
      ) : finalEvent ? (
        <InteractiveVoteCard
          event={finalEvent}
          voteOverride={officialFinal ? undefined : voteFinalOverride}
        />
      ) : null}
      {err && (
        <p className="bf-bracket-error" role="alert">
          {err}
        </p>
      )}
      {finalEvent && !officialFinal && readyFromSemis && (
        <p className="bf-bracket-final-note">
          Cruce según tus semifinales. Si coincide con la final del calendario, el voto se sincroniza solo.
        </p>
      )}
      {officialFinal && votes[officialFinal.matchId] && (
        <p className="bf-bracket-final-note is-synced">
          Voto en partido oficial.
          <Link href={`/predictions#pick-${officialFinal.matchId}`}> Ver en lista</Link>
        </p>
      )}
    </div>
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
  const qfCount = bracket.quarters.length;
  const sfCount = bracket.semis.length;

  return (
    <section
      className="bf-predict-bracket bf-predict-key-matches"
      aria-labelledby="predict-bracket-title"
    >
      <h2 id="predict-bracket-title" className="bf-predict-pickem-section-title">
        Bracket playoff
        <span className="bf-predict-pickem-count">
          {qfCount + sfCount + (bracket.final ? 1 : 0)}
        </span>
      </h2>
      <p className="bf-predict-section-lead">
        {bracket.tournamentName}
        {bracket.region ? ` · ${bracket.region}` : ""}
        {" — "}
        {[
          qfCount > 0 ? `${qfCount} VS cuartos` : "",
          sfCount > 0 ? `${sfCount} VS semis` : "",
          bracket.final || sfCount > 0 ? "1 VS final (grande)" : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {qfCount > 0 && (
        <div className="bf-predict-bracket-phase">
          <h3 className="bf-predict-bracket-phase-title">Cuartos de final</h3>
          <div
            className={`bf-predict-pickem-grid is-key is-bracket-qf is-count-${Math.min(qfCount, 4)}`}
          >
            {bracket.quarters.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}

      {sfCount > 0 && (
        <div className="bf-predict-bracket-phase">
          {qfCount > 0 && <div className="bf-bracket-tree-connectors" aria-hidden />}
          <h3 className="bf-predict-bracket-phase-title">Semifinales</h3>
          <div
            className={`bf-predict-pickem-grid is-key is-bracket-sf is-count-${Math.min(sfCount, 2)}`}
          >
            {bracket.semis.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}

      {(sfCount > 0 || bracket.final) && (
        <>
          {sfCount > 0 && <div className="bf-bracket-tree-connectors is-to-final" aria-hidden />}
          <BracketFinalBlock bracket={bracket} votes={votes} events={events} />
        </>
      )}
    </section>
  );
}
