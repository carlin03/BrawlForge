"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EsportsMatch } from "@/lib/data/matches";
import { teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

export function MatchWinnerDuel({
  match,
  pick,
  onPickChange,
  rewardPoints = 55,
  disabled,
}: {
  match: EsportsMatch;
  pick: "A" | "B" | null;
  onPickChange?: (p: "A" | "B" | null) => void;
  rewardPoints?: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { castVote } = useGame();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const closed = match.status === "finished" || disabled;

  async function vote(side: "A" | "B") {
    if (closed || saving) return;
    onPickChange?.(side);
    if (!isLoggedIn) {
      router.push(`/login?next=/matches/${match.id}`);
      return;
    }
    setSaving(true);
    setErr("");
    const res = await castVote(match.id, side, rewardPoints);
    setSaving(false);
    if (res.error) {
      setErr(res.error);
      onPickChange?.(null);
    }
  }

  const nameA = teamName(match.teamASlug);
  const nameB = teamName(match.teamBSlug);

  return (
    <div className="bf-match-winner-duel">
      <p className="bf-match-predict-block-title">Ganador del partido</p>
      <div className="bf-match-winner-duel-grid">
        <button
          type="button"
          className={`bf-match-winner-side is-a ${pick === "A" ? "is-on" : ""}`}
          onClick={() => void vote("A")}
          disabled={closed || saving}
        >
          <TeamLogo slug={match.teamASlug} name={nameA} size={72} glow />
          <span className="bf-match-winner-name">{nameA}</span>
          {pick === "A" && <span className="bf-match-winner-pick">Tu pick</span>}
        </button>

        <span className="bf-match-winner-vs" aria-hidden>
          VS
        </span>

        <button
          type="button"
          className={`bf-match-winner-side is-b ${pick === "B" ? "is-on" : ""}`}
          onClick={() => void vote("B")}
          disabled={closed || saving}
        >
          <TeamLogo slug={match.teamBSlug} name={nameB} size={72} glow />
          <span className="bf-match-winner-name">{nameB}</span>
          {pick === "B" && <span className="bf-match-winner-pick">Tu pick</span>}
        </button>
      </div>
      {!isLoggedIn && !closed && (
        <p className="bf-match-predict-hint">
          <Link href={`/login?next=/matches/${match.id}`}>Inicia sesión</Link> para guardar tu voto (+{rewardPoints}{" "}
          pts).
        </p>
      )}
      {saving && <p className="bf-match-predict-hint">Guardando voto…</p>}
      {err && <p className="bf-auth-error">{err}</p>}
    </div>
  );
}
