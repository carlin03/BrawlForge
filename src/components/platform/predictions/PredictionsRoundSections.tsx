"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function GranFinalRound({
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
  const waitingSemis = needTwoSemis && (!winner1 || !winner2);

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
    if (bracket.final) return { a: bracket.final.teamASlug, b: bracket.final.teamBSlug };
    return null;
  }, [needTwoSemis, winner1, winner2, bracket.final]);

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
    if (waitingSemis || !displayWinners) return bracket.final ?? null;

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
  }, [waitingSemis, displayWinners, officialFinal, bracket, votes, draftFinal]);

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

  return (
    <section className="bf-predict-key-matches bf-predict-round-final" aria-labelledby="predict-final-title">
      <h2 id="predict-final-title" className="bf-predict-pickem-section-title">
        Gran final
        <span className="bf-predict-pickem-count">1</span>
      </h2>
      <p className="bf-predict-section-lead">
        {bracket.tournamentName}
        {bracket.region ? ` · ${bracket.region}` : ""}
        {waitingSemis
          ? " — Vota las semifinales; el cruce se arma con tus ganadores."
          : " — Misma card que partidos clave, con más peso en puntos."}
      </p>
      {waitingSemis ? (
        <p className="bf-predict-round-hint">Pendiente: elige ganador en las dos semifinales de arriba.</p>
      ) : finalEvent ? (
        <div className="bf-predict-pickem-grid is-key is-single-final">
          <InteractiveVoteCard
            event={finalEvent}
            featured
            voteOverride={officialFinal ? undefined : voteFinalOverride}
          />
        </div>
      ) : null}
      {err && (
        <p className="bf-predict-round-error" role="alert">
          {err}
        </p>
      )}
    </section>
  );
}

/** Eliminatoria por rondas — mismas secciones que el resto de Pick'em (sin bracket especial). */
export function PredictionsRoundSections({
  bracket,
  votes,
  events,
}: {
  bracket: PlayoffBracketView;
  votes: Record<string, "A" | "B">;
  events: EnrichedPrediction[];
}) {
  const qf = bracket.quarters;
  const sf = bracket.semis;

  return (
    <>
      {qf.length > 0 && (
        <section className="bf-predict-active-main" aria-labelledby="predict-qf-title">
          <h2 id="predict-qf-title" className="bf-predict-pickem-section-title">
            Cuartos de final
            <span className="bf-predict-pickem-count">{qf.length}</span>
          </h2>
          <p className="bf-predict-section-lead">
            {bracket.tournamentName} — partidos normales del calendario (misma card que jornada).
          </p>
          <div className="bf-predict-pickem-grid">
            {qf.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {sf.length > 0 && (
        <section className="bf-predict-key-matches" aria-labelledby="predict-sf-title">
          <h2 id="predict-sf-title" className="bf-predict-pickem-section-title">
            Semifinales
            <span className="bf-predict-pickem-count">{sf.length}</span>
          </h2>
          <p className="bf-predict-section-lead">
            Partidos clave del torneo — más puntos si aciertas.
          </p>
          <div className="bf-predict-pickem-grid is-key">
            {sf.map((e) => (
              <InteractiveVoteCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {(sf.length > 0 || bracket.final) && (
        <GranFinalRound bracket={bracket} votes={votes} events={events} />
      )}
    </>
  );
}
