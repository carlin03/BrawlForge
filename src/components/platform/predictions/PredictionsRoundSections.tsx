"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BracketMatchCard } from "@/components/platform/predictions/BracketMatchCard";
import { BracketPendingDuel } from "@/components/platform/predictions/BracketPendingDuel";
import type { PredictRoundFilterKey } from "@/lib/data/predictions-filters";
import { bracketShowsRound } from "@/lib/data/predictions-filters";
import { resolveBracketLayout } from "@/lib/data/bracket-config";
import type { EnrichedPrediction, PlayoffBracketView } from "@/lib/data/predictions-ui";
import {
  findBracketFinalEvent,
  getBracketPickWinner,
} from "@/lib/data/predictions-ui";
import {
  isBracketReadyToVote,
  resolveFinalReveal,
  resolveSemiReveal,
  semiWinner,
} from "@/lib/data/bracket-reveal";
import { DEFAULT_PICKEM_STAGE_POINTS, getPickemRewardPoints } from "@/lib/data/pickem-reward-points";
import { isPendingTeamSlug } from "@/lib/data/match-meta";
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

export function GranFinalRound({
  bracket,
  votes,
  events,
  compact = false,
}: {
  bracket: PlayoffBracketView;
  votes: Record<string, "A" | "B">;
  events: EnrichedPrediction[];
  compact?: boolean;
}) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { castVote } = useGame();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [draftFinal, setDraftFinal] = useState<BracketDraftPick | null>(null);

  const needTwoSemis = bracket.semis.length >= 2;
  const semiReveal0 = bracket.semis[0]
    ? resolveSemiReveal(0, bracket.semis[0], bracket.quarters, votes)
    : null;
  const semiReveal1 = bracket.semis[1]
    ? resolveSemiReveal(1, bracket.semis[1], bracket.quarters, votes)
    : null;
  const winner1 =
    bracket.semis[0] && semiReveal0
      ? semiWinner(bracket.semis[0], semiReveal0, votes)
      : bracket.semis[0]
        ? winnerFromEvent(bracket.semis[0], votes)
        : null;
  const winner2 =
    bracket.semis[1] && semiReveal1
      ? semiWinner(bracket.semis[1], semiReveal1, votes)
      : bracket.semis[1]
        ? winnerFromEvent(bracket.semis[1], votes)
        : null;
  const finalReveal = resolveFinalReveal(bracket.semis, bracket.quarters, votes);
  const progressiveFinal =
    needTwoSemis || bracket.quarters.length >= 4 || Boolean(
      bracket.final &&
        (isPendingTeamSlug(bracket.final.teamASlug) || isPendingTeamSlug(bracket.final.teamBSlug)),
    );

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

  const finalCardEvent = useMemo((): EnrichedPrediction => {
    if (bracket.final) return bracket.final;
    const ref = bracket.semis[0] ?? bracket.quarters[0];
    return {
      id: `bracket-gf-placeholder-${bracket.tournamentSlug}`,
      matchId: `bracket-gf-placeholder-${bracket.tournamentSlug}`,
      teamASlug: "tbd",
      teamBSlug: "tbd",
      pickAPct: 50,
      pickBPct: 50,
      totalVotes: 0,
      rewardPoints: getPickemRewardPoints("Grand Final", "Bo5", DEFAULT_PICKEM_STAGE_POINTS),
      featured: true,
      userPick: null,
      status: "open",
      stage: "Grand Final",
      tournamentSlug: bracket.tournamentSlug,
      deadline: ref?.deadline ?? new Date().toISOString(),
      stageMeta: getMatchStageMeta("Grand Final"),
      displayStatus: "upcoming",
      tournamentShortName: bracket.tournamentName,
      region: bracket.region,
      outcome: "none",
      pointsEarned: 0,
    };
  }, [bracket]);

  const finalEvent = useMemo((): EnrichedPrediction | null => {
    if (!displayWinners) return finalCardEvent;

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
  }, [displayWinners, officialFinal, bracket, votes, draftFinal, finalCardEvent]);

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

  const finalReady = isBracketReadyToVote(finalReveal);

  return (
    <section
      className={`bf-predict-key-matches bf-predict-round-final ${compact ? "is-compact-round" : ""}`}
      aria-labelledby={compact ? undefined : "predict-final-title"}
    >
      {compact ? (
        <h4 className="bf-predict-bracket-round-sub">Gran final</h4>
      ) : (
        <>
          <h2 id="predict-final-title" className="bf-predict-pickem-section-title">
            Gran final
            <span className="bf-predict-pickem-count">1</span>
          </h2>
          <p className="bf-predict-section-lead">
            {bracket.tournamentName}
            {bracket.region ? ` · ${bracket.region}` : ""}
            {!finalReady
              ? " — Los equipos se desbloquean al votar las semifinales."
              : " — Tu bracket personal; más puntos si aciertas."}
          </p>
        </>
      )}
      <div className="bf-predict-bracket-grand-final">
        <BracketMatchCard
          event={finalEvent ?? finalCardEvent}
          votes={votes}
          bracketReveal={progressiveFinal ? finalReveal : undefined}
          featured
          voteOverride={officialFinal ? undefined : voteFinalOverride}
        />
      </div>
      {err && (
        <p className="bf-predict-round-error" role="alert">
          {err}
        </p>
      )}
    </section>
  );
}

function BracketQuarterGrid({
  matches,
  votes,
  layout,
}: {
  matches: EnrichedPrediction[];
  votes: Record<string, "A" | "B">;
  layout: ReturnType<typeof resolveBracketLayout>;
}) {
  if (matches.length === 0) return null;

  if (matches.length === 1 || layout === "1") {
    return (
      <div className="bf-predict-bracket-qf bf-predict-bracket-stack is-solo-round">
        {matches.map((e) => (
          <BracketMatchCard key={e.id} event={e} votes={votes} />
        ))}
      </div>
    );
  }

  return (
    <div className="bf-predict-bracket-qf-grid" data-layout="2">
      {matches.map((e) => (
        <BracketMatchCard key={e.id} event={e} votes={votes} />
      ))}
    </div>
  );
}

function BracketSemiGrid({
  matches,
  quarters,
  votes,
  layout,
}: {
  matches: EnrichedPrediction[];
  quarters: EnrichedPrediction[];
  votes: Record<string, "A" | "B">;
  layout: ReturnType<typeof resolveBracketLayout>;
}) {
  const solo = matches.length === 1 || layout === "1";
  return (
    <div
      className={`bf-predict-bracket-sf ${solo ? "is-solo-round bf-predict-bracket-stack" : "is-layout-2"}`}
      data-layout={layout}
    >
      {matches.map((e, i) => (
        <BracketMatchCard
          key={e.id}
          event={e}
          votes={votes}
          bracketReveal={resolveSemiReveal(i, e, quarters, votes)}
        />
      ))}
    </div>
  );
}

/** Eliminatoria por rondas — cuartos 2+2, semis lado a lado, final grande. */
export function PredictionsRoundSections({
  bracket,
  votes,
  events,
  roundFilter = "all",
}: {
  bracket: PlayoffBracketView;
  votes: Record<string, "A" | "B">;
  events: EnrichedPrediction[];
  roundFilter?: PredictRoundFilterKey;
}) {
  const qf = bracket.quarters;
  const sf = bracket.semis;
  const show = bracketShowsRound(bracket, roundFilter);
  const qfLayout = resolveBracketLayout(bracket.layout, qf.length);
  const sfLayout = resolveBracketLayout(bracket.layout, sf.length);

  return (
    <>
      {show.quarters && qf.length > 0 && (
        <section className="bf-predict-active-main" aria-labelledby="predict-qf-title">
          <h2 id="predict-qf-title" className="bf-predict-pickem-section-title">
            Cuartos de final
            <span className="bf-predict-pickem-count">{qf.length}</span>
          </h2>
          <p className="bf-predict-section-lead">
            {bracket.tournamentName} — elige ganadores; alimentan las semifinales de abajo.
          </p>
          <BracketQuarterGrid matches={qf} votes={votes} layout={qfLayout} />
        </section>
      )}

      {show.semis && sf.length > 0 && (
        <section className="bf-predict-key-matches" aria-labelledby="predict-sf-title">
          <h2 id="predict-sf-title" className="bf-predict-pickem-section-title">
            Semifinales
            <span className="bf-predict-pickem-count">{sf.length}</span>
          </h2>
          <p className="bf-predict-section-lead">
            {qf.length > 0
              ? "Dos semifinales — los equipos en gris hasta votar los cuartos de arriba."
              : "Semifinales del torneo — elige ganador en cada duelo."}
          </p>
          {qf.length >= 4 && sf.length === 1 && (
            <p className="bf-predict-round-hint">
              Este torneo tiene una sola semifinal en el calendario — la gran final puede estar fijada aparte (p. ej. EA/NA/SA MF).
            </p>
          )}
          {qf.length >= 4 && sf.length === 0 && (
            <p className="bf-predict-round-hint">
              Falta configurar semifinales en admin (fase Semifinal).
            </p>
          )}
          <BracketSemiGrid matches={sf} quarters={qf} votes={votes} layout={sfLayout} />
        </section>
      )}

      {show.final && (sf.length > 0 || bracket.final) && (
        <GranFinalRound bracket={bracket} votes={votes} events={events} />
      )}
    </>
  );
}
