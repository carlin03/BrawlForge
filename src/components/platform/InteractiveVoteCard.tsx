"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PredictionEvent } from "@/lib/data/predictions";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { getPredictionLabel, getPredictionTournament } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import { getMatch, getTournament } from "@/lib/data/matches";
import { formatPredictMatchTime } from "@/lib/data/predictions-ui";
import { getMatchStageMeta, getPredictDisplayStatus } from "@/lib/data/match-stage-meta";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { MatchContextStrip } from "@/components/platform/predictions/MatchContextStrip";
import { MatchStageBadge } from "@/components/platform/predictions/MatchStageBadge";
import { MatchStatusPill } from "@/components/platform/predictions/MatchStatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

interface InteractiveVoteCardProps {
  event: PredictionEvent | EnrichedPrediction;
  featured?: boolean;
  initialPick?: "A" | "B" | null;
}

export function InteractiveVoteCard({ event, featured, initialPick = null }: InteractiveVoteCardProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { castVote } = useGame();
  const [pick, setPick] = useState<"A" | "B" | null>(event.userPick ?? initialPick);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const hasVotes = hasRealVotes(event);
  const closed = event.status === "closed";
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");
  const match = getMatch(event.matchId);
  const matchTime = formatPredictMatchTime(match?.date ?? event.deadline);
  const isLive = match?.status === "live";
  const stageMeta =
    "stageMeta" in event && event.stageMeta
      ? event.stageMeta
      : getMatchStageMeta(event.stage);
  const displayStatus =
    "displayStatus" in event && event.displayStatus
      ? event.displayStatus
      : getPredictDisplayStatus({
          eventStatus: event.status,
          matchStatus: match?.status,
        });
  const tournamentShortName =
    "tournamentShortName" in event && event.tournamentShortName
      ? event.tournamentShortName
      : getTournament(event.tournamentSlug)?.shortName ?? getPredictionTournament(event);
  const region =
    "region" in event && event.region ? event.region : match?.region ?? getTournament(event.tournamentSlug)?.region;
  const tierClass = stageMeta.cardClass;
  const roundClass = stageMeta.badgeClass;
  const contextEvent = {
    ...event,
    stageMeta,
    displayStatus:
      displayStatus === "open" && match?.status === "upcoming" ? "upcoming" : displayStatus,
    tournamentShortName,
    region,
  } as EnrichedPrediction;

  async function vote(side: "A" | "B") {
    if (closed || saving) return;
    if (!isLoggedIn) {
      router.push("/login?next=/predictions");
      return;
    }
    setPick(side);
    setErr("");
    setSaving(true);
    const res = await castVote(event.matchId, side, event.rewardPoints);
    setSaving(false);
    if (res.error) {
      setErr(res.error);
      setPick(event.userPick ?? null);
    }
  }

  return (
    <article
      id={`pick-${event.matchId}`}
      className={[
        "bf-vote-card",
        "bf-bsc-vote-card",
        tierClass,
        roundClass,
        featured ? "is-featured" : "",
        pick ? "has-pick" : "",
        closed ? "is-closed" : "",
        pick === "A" ? "picked-a" : pick === "B" ? "picked-b" : "",
        contextEvent.displayStatus ? `status-${contextEvent.displayStatus}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="bf-bsc-vote-stripe" aria-hidden />
      <div className="bf-vote-card-glow" aria-hidden />

      {stageMeta ? (
        <>
          <MatchContextStrip event={contextEvent} />
          {stageMeta.stakesLine && <p className="bf-vote-stakes-line">{stageMeta.stakesLine}</p>}
        </>
      ) : (
        <header className="bf-vote-card-head">
          <TournamentLogo slug={event.tournamentSlug} name={getPredictionTournament(event)} size={featured ? 36 : 28} />
          <div className="bf-vote-card-meta">
            <span className="bf-bsc-vote-tourney">{getPredictionTournament(event)}</span>
            <strong>
              {event.stage}
              {isLive ? " · EN DIRECTO" : ` · ${matchTime}`}
            </strong>
          </div>
          <span className="bf-vote-reward bf-vote-reward-gold">+{event.rewardPoints}</span>
        </header>
      )}

      <div className="bf-vote-arena">
        <button
          type="button"
          className={`bf-vote-side bf-vote-side-a ${pick === "A" ? "is-picked" : ""} ${closed && event.correctPick === "A" ? "is-winner" : ""}`}
          onClick={() => void vote("A")}
          disabled={closed || saving}
          aria-label={`Votar por ${labelA}`}
        >
          <span className="bf-vote-side-tag bf-vote-side-tag-a" title={labelA}>
            AZUL
          </span>
          <span className="bf-vote-side-logo">
            <TeamLogo slug={event.teamASlug} name={labelA} size={featured ? 72 : 56} />
          </span>
          <span className="bf-vote-name bf-vote-name-lg" title={labelA}>
            {labelA}
          </span>
          {hasVotes ? (
            <span className="bf-vote-pct">{event.pickAPct}%</span>
          ) : (
            <span className="bf-vote-no-pct">Sin votos</span>
          )}
          {pick === "A" && !closed && <span className="bf-vote-pick-badge">Tu voto</span>}
        </button>

        <div className="bf-vote-vs" aria-hidden>
          <span className="bf-vote-vs-label">VS</span>
          {hasVotes ? (
            <span className="bf-vote-votes">{event.totalVotes} votos</span>
          ) : (
            <span className="bf-vote-votes">Sé el primero</span>
          )}
        </div>

        <button
          type="button"
          className={`bf-vote-side bf-vote-side-b ${pick === "B" ? "is-picked" : ""} ${closed && event.correctPick === "B" ? "is-winner" : ""}`}
          onClick={() => void vote("B")}
          disabled={closed || saving}
          aria-label={`Votar por ${labelB}`}
        >
          <span className="bf-vote-side-tag bf-vote-side-tag-b" title={labelB}>
            ROJO
          </span>
          <span className="bf-vote-side-logo">
            <TeamLogo slug={event.teamBSlug} name={labelB} size={featured ? 72 : 56} />
          </span>
          <span className="bf-vote-name bf-vote-name-lg" title={labelB}>
            {labelB}
          </span>
          {hasVotes ? (
            <span className="bf-vote-pct">{event.pickBPct}%</span>
          ) : (
            <span className="bf-vote-no-pct">Sin votos</span>
          )}
          {pick === "B" && !closed && <span className="bf-vote-pick-badge">Tu voto</span>}
        </button>
      </div>

      {hasVotes && (
        <div className="bf-bsc-poll" role="presentation" aria-label={`Comunidad: ${labelA} ${event.pickAPct}% · ${labelB} ${event.pickBPct}%`}>
          <div className="bf-bsc-poll-a" style={{ flex: `${event.pickAPct} 1 0` }} title={`${labelA} ${event.pickAPct}%`} />
          <div className="bf-bsc-poll-b" style={{ flex: `${event.pickBPct} 1 0` }} title={`${labelB} ${event.pickBPct}%`} />
        </div>
      )}

      <footer className="bf-vote-foot">
        {!closed && !pick && !isLoggedIn && (
          <Link href="/login?next=/predictions" className="bf-bsc-vote-login">
            Inicia sesión para predecir
          </Link>
        )}
        {!closed && saving && <span className="bf-vote-hint">Guardando voto…</span>}
        {!closed && pick && !saving && (
          <span className={`bf-vote-confirmed ${pick === "A" ? "is-blue" : "is-red"}`}>
            Voto guardado · {pick === "A" ? labelA : labelB}
          </span>
        )}
        {err && <span className="bf-auth-error">{err}</span>}
        {closed && event.correctPick && (
          <span className={`bf-vote-closed-winner ${event.correctPick === "A" ? "is-blue" : "is-red"}`}>
            Ganador: {getPredictionLabel(event, event.correctPick)}
          </span>
        )}
      </footer>
    </article>
  );
}
