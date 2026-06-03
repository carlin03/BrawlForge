"use client";

import { useEffect, useState } from "react";
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
import {
  type BracketRevealState,
  isBracketReadyToVote,
  mapBracketSlugToApiSide,
  mapBracketRevealToApiSide,
} from "@/lib/data/bracket-reveal";
import { teamName } from "@/lib/data";
import { bracketSlotDisplayLabel, isBracketPlaceholderSlug } from "@/lib/data/bracket-slot-display";
import { getTeam } from "@/lib/data/teams";
import { parseMatchMeta, getMatchPredictionsConfig } from "@/lib/data/match-meta";
import { ScoreStepperPicker } from "@/components/match-esports/ScoreStepperPicker";

interface InteractiveVoteCardProps {
  event: PredictionEvent | EnrichedPrediction;
  featured?: boolean;
  initialPick?: "A" | "B" | null;
  /** Voto custom (p. ej. final dinámica del bracket) */
  voteOverride?: (side: "A" | "B") => Promise<{ error?: string } | void>;
  /** Bracket progresivo: lados en gris hasta desbloquear con la ronda anterior */
  bracketReveal?: BracketRevealState;
  /** Tras elegir ganador (desbloquea predicción avanzada en ficha de partido) */
  onPickChange?: (pick: "A" | "B" | null) => void;
  /** En /matches/[id] el stepper va en MatchPredictionsCenter, no aquí */
  hideEmbeddedExactScore?: boolean;
  loginNextPath?: string;
}

function labelForSlug(slug: string): string {
  return teamName(slug);
}

function tagForSlug(slug: string | null): string {
  if (!slug) return "—";
  const team = getTeam(slug);
  return team?.tag ?? teamName(slug).slice(0, 3).toUpperCase();
}

export function InteractiveVoteCard({
  event,
  featured,
  initialPick = null,
  voteOverride,
  bracketReveal,
  onPickChange,
  hideEmbeddedExactScore = false,
  loginNextPath,
}: InteractiveVoteCardProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { castVote, game } = useGame();
  const [pick, setPick] = useState<"A" | "B" | null>(event.userPick ?? initialPick);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const fromGame = game?.votes?.[event.matchId];
    const next = fromGame ?? event.userPick ?? initialPick ?? null;
    setPick((prev) => (prev === next ? prev : next));
  }, [event.userPick, event.matchId, game?.votes, initialPick]);

  const hasVotes = hasRealVotes(event);
  const closed = event.status === "closed";
  const revealA = bracketReveal?.sideA.revealed ?? true;
  const revealB = bracketReveal?.sideB.revealed ?? true;
  const slugA = revealA
    ? (bracketReveal?.sideA.teamSlug ??
      (bracketReveal ? null : event.teamASlug))
    : null;
  const slugB = revealB
    ? (bracketReveal?.sideB.teamSlug ??
      (bracketReveal ? null : event.teamBSlug))
    : null;
  const bracketReady = bracketReveal ? isBracketReadyToVote(bracketReveal) : true;
  const labelA = slugA
    ? isBracketPlaceholderSlug(slugA)
      ? bracketSlotDisplayLabel(slugA)
      : labelForSlug(slugA)
    : "Por definir";
  const labelB = slugB
    ? isBracketPlaceholderSlug(slugB)
      ? bracketSlotDisplayLabel(slugB)
      : labelForSlug(slugB)
    : "Por definir";
  const match = getMatch(event.matchId);
  const matchMeta = parseMatchMeta(match?.meta);
  const predCfg = getMatchPredictionsConfig(matchMeta);
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
    if (bracketReveal && (side === "A" ? !revealA : !revealB)) return;
    if (bracketReveal && !bracketReady) return;
    if (!isLoggedIn) {
      router.push(loginNextPath ?? `/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/predictions")}`);
      return;
    }
    setPick(side);
    onPickChange?.(side);
    setErr("");
    setSaving(true);
    if (voteOverride) {
      const res = await voteOverride(side);
      setSaving(false);
      if (res && "error" in res && res.error) {
        setErr(res.error);
        setPick(event.userPick ?? null);
        onPickChange?.(event.userPick ?? null);
      }
      return;
    }
    let apiSide: "A" | "B" = side;
    if (bracketReveal && slugA && slugB) {
      const pickedSlug = side === "A" ? slugA : slugB;
      const mapped =
        mapBracketRevealToApiSide(bracketReveal, pickedSlug) ??
        mapBracketSlugToApiSide(event, pickedSlug);
      if (!mapped) {
        setSaving(false);
        setErr("Tu bracket no coincide con este emparejamiento oficial.");
        setPick(event.userPick ?? null);
        return;
      }
      apiSide = mapped;
    }
    const res = await castVote(event.matchId, apiSide, event.rewardPoints);
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
        bracketReveal && (!revealA || !revealB) ? "is-bracket-masked" : "",
        bracketReveal && bracketReady ? "is-bracket-ready" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="bf-bsc-vote-stripe" aria-hidden />
      <div className="bf-vote-card-glow" aria-hidden />

      {stageMeta ? (
        <>
          <MatchContextStrip event={contextEvent} hasVote={Boolean(pick)} />
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

      <div className={`bf-vote-arena ${bracketReveal ? "is-bracket-arena" : ""}`}>
        <button
          type="button"
          className={`bf-vote-side bf-vote-side-a ${!revealA ? "is-ghost" : ""} ${pick === "A" ? "is-picked" : ""} ${closed && event.correctPick === "A" ? "is-winner" : ""}`}
          onClick={() => void vote("A")}
          disabled={closed || saving || !revealA || (bracketReveal !== undefined && !bracketReady)}
          aria-label={revealA ? `Votar por ${labelA}` : "Equipo por definir — vota el cuarto de arriba"}
        >
          <span className="bf-vote-side-tag bf-vote-side-tag-a" title={labelA}>
            {tagForSlug(slugA)}
          </span>
          <span className="bf-vote-side-logo">
            {slugA ? (
              <TeamLogo slug={slugA} name={labelA} size={featured ? 72 : 56} />
            ) : (
              <span className="bf-bracket-ghost-mark" aria-hidden>
                ?
              </span>
            )}
          </span>
          <span className="bf-vote-name bf-vote-name-lg" title={labelA}>
            {revealA ? labelA : "Por definir"}
          </span>
          {revealA &&
            (hasVotes ? (
              <span className="bf-vote-pct">{event.pickAPct}%</span>
            ) : (
              <span className="bf-vote-no-pct">Sin votos</span>
            ))}
          {pick === "A" && !closed && revealA && <span className="bf-vote-pick-badge">Tu voto</span>}
        </button>

        <div className="bf-vote-vs" aria-hidden>
          <span className="bf-vote-vs-label">VS</span>
          {bracketReady && hasVotes ? (
            <span className="bf-vote-votes">{event.totalVotes} votos</span>
          ) : bracketReveal && !bracketReady ? (
            <span className="bf-vote-votes">Bracket</span>
          ) : hasVotes ? (
            <span className="bf-vote-votes">{event.totalVotes} votos</span>
          ) : (
            <span className="bf-vote-votes">Sé el primero</span>
          )}
        </div>

        <button
          type="button"
          className={`bf-vote-side bf-vote-side-b ${!revealB ? "is-ghost" : ""} ${pick === "B" ? "is-picked" : ""} ${closed && event.correctPick === "B" ? "is-winner" : ""}`}
          onClick={() => void vote("B")}
          disabled={closed || saving || !revealB || (bracketReveal !== undefined && !bracketReady)}
          aria-label={revealB ? `Votar por ${labelB}` : "Equipo por definir — vota el cuarto de arriba"}
        >
          <span className="bf-vote-side-tag bf-vote-side-tag-b" title={labelB}>
            {tagForSlug(slugB)}
          </span>
          <span className="bf-vote-side-logo">
            {slugB ? (
              <TeamLogo slug={slugB} name={labelB} size={featured ? 72 : 56} />
            ) : (
              <span className="bf-bracket-ghost-mark" aria-hidden>
                ?
              </span>
            )}
          </span>
          <span className="bf-vote-name bf-vote-name-lg" title={labelB}>
            {revealB ? labelB : "Por definir"}
          </span>
          {revealB &&
            (hasVotes ? (
              <span className="bf-vote-pct">{event.pickBPct}%</span>
            ) : (
              <span className="bf-vote-no-pct">Sin votos</span>
            ))}
          {pick === "B" && !closed && revealB && <span className="bf-vote-pick-badge">Tu voto</span>}
        </button>
      </div>

      {hasVotes && bracketReady && (
        <div className="bf-bsc-poll" role="presentation" aria-label={`Comunidad: ${labelA} ${event.pickAPct}% · ${labelB} ${event.pickBPct}%`}>
          <div className="bf-bsc-poll-a" style={{ flex: `${event.pickAPct} 1 0` }} title={`${labelA} ${event.pickAPct}%`} />
          <div className="bf-bsc-poll-b" style={{ flex: `${event.pickBPct} 1 0` }} title={`${labelB} ${event.pickBPct}%`} />
        </div>
      )}

      {!closed && !hideEmbeddedExactScore && predCfg.exact_score && match && pick && (
        <ScoreStepperPicker
          matchId={event.matchId}
          format={match.format}
          teamASlug={match.teamASlug}
          teamBSlug={match.teamBSlug}
          teamAName={labelA}
          teamBName={labelB}
          initialScore={game?.exactScores?.[event.matchId] ?? null}
        />
      )}

      <footer className="bf-vote-foot">
        {bracketReveal && !bracketReady && !closed && (
          <span className="bf-vote-hint">Vota la ronda anterior para desbloquear los equipos.</span>
        )}
        {!closed && bracketReady && !pick && !isLoggedIn && (
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
