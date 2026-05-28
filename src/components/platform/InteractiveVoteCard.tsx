"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionLabel, getPredictionTournament } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

interface InteractiveVoteCardProps {
  event: PredictionEvent;
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
      className={`bf-vote-card bf-hover-lift bf-shine-hover ${featured ? "is-featured" : ""} ${pick ? "has-pick" : ""} ${closed ? "is-closed" : ""}`}
    >
      <div className="bf-vote-card-glow" aria-hidden />
      <header className="bf-vote-card-head">
        <TournamentLogo slug={event.tournamentSlug} name={getPredictionTournament(event)} size={featured ? 36 : 28} />
        <div>
          <span className="bf-home-eyebrow">{getPredictionTournament(event)}</span>
          <strong>{event.stage}</strong>
        </div>
        <span className="bf-vote-reward">+{event.rewardPoints}</span>
      </header>

      <div className="bf-vote-arena">
        <button
          type="button"
          className={`bf-vote-side ${pick === "A" ? "is-picked" : ""} ${closed && event.correctPick === "A" ? "is-winner" : ""}`}
          onClick={() => void vote("A")}
          disabled={closed || saving}
        >
          <TeamLogo slug={event.teamASlug} name={labelA} size={featured ? 64 : 48} />
          <span className="bf-vote-name">{labelA}</span>
          {hasVotes ? (
            <span className="bf-vote-pct">{event.pickAPct}%</span>
          ) : (
            <span className="bf-vote-no-pct">Comunidad</span>
          )}
          {pick === "A" && !closed && <span className="bf-vote-pick-badge">Tu pick</span>}
        </button>

        <div className="bf-vote-vs">
          <span>VS</span>
          {hasVotes ? (
            <span className="bf-vote-votes">{event.totalVotes} votos</span>
          ) : (
            <span className="bf-vote-votes">Sin votos aún</span>
          )}
        </div>

        <button
          type="button"
          className={`bf-vote-side ${pick === "B" ? "is-picked" : ""} ${closed && event.correctPick === "B" ? "is-winner" : ""}`}
          onClick={() => void vote("B")}
          disabled={closed || saving}
        >
          <TeamLogo slug={event.teamBSlug} name={labelB} size={featured ? 64 : 48} />
          <span className="bf-vote-name">{labelB}</span>
          {hasVotes ? (
            <span className="bf-vote-pct">{event.pickBPct}%</span>
          ) : (
            <span className="bf-vote-no-pct">Comunidad</span>
          )}
          {pick === "B" && !closed && <span className="bf-vote-pick-badge">Tu pick</span>}
        </button>
      </div>

      {hasVotes && (
        <div className="bp-poll-bar">
          <div className="bp-poll-bar-a" style={{ width: `${event.pickAPct}%` }} />
          <div className="bp-poll-bar-b" style={{ width: `${event.pickBPct}%` }} />
        </div>
      )}

      <footer className="bf-vote-foot">
        {!closed && !pick && !isLoggedIn && (
          <Link href="/login?next=/predictions" className="bf-home-link">
            Inicia sesión para predecir
          </Link>
        )}
        {!closed && saving && <span className="bf-vote-hint">Guardando voto…</span>}
        {!closed && pick && !saving && (
          <span className="bf-vote-confirmed">Voto guardado · {getPredictionLabel(event, pick)}</span>
        )}
        {err && <span className="bf-auth-error">{err}</span>}
        {closed && event.correctPick && (
          <span>Ganador: {getPredictionLabel(event, event.correctPick)}</span>
        )}
      </footer>
    </article>
  );
}
