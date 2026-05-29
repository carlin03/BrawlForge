"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Radio, Target } from "lucide-react";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { formatPredictMatchTime, tournamentLabel } from "@/lib/data/predictions-ui";
import { getPredictionLabel } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

export function FeaturedPredictionDuel({ event }: { event: EnrichedPrediction }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { castVote } = useGame();
  const [pick, setPick] = useState<"A" | "B" | null>(event.userPick ?? null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");
  const hasVotes = hasRealVotes(event);
  const isLive = event.matchStatus === "live";
  const tour = tournamentLabel(event);

  async function vote(side: "A" | "B") {
    if (event.status === "closed" || saving) return;
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
    <section className="bf-predict-spotlight is-tier-1" aria-labelledby="predict-spotlight-title">
      <div className="bf-predict-spotlight-head">
        <div>
          <p id="predict-spotlight-title" className="bf-predict-spotlight-kicker">
            <Target size={14} aria-hidden /> Partido del día
          </p>
          <div className="bf-predict-spotlight-meta">
            <TournamentLogo slug={event.tournamentSlug} name={tour} size={28} glow={false} />
            <span>{tour}</span>
            <span className="bf-predict-spotlight-dot">·</span>
            <span>{event.stage}</span>
          </div>
        </div>
        <div className="bf-predict-spotlight-badges">
          {isLive && (
            <span className="bf-predict-spotlight-live">
              <Radio size={12} aria-hidden /> EN DIRECTO
            </span>
          )}
          <span className="bf-predict-spotlight-reward">+{event.rewardPoints} pts</span>
        </div>
      </div>

      <div className="bf-predict-spotlight-arena">
        <button
          type="button"
          className={`bf-predict-spotlight-side is-a ${pick === "A" ? "is-picked" : ""}`}
          onClick={() => void vote("A")}
          disabled={event.status === "closed" || saving}
        >
          <TeamLogo slug={event.teamASlug} name={labelA} size={112} glow />
          <strong>{labelA}</strong>
          <span className="bf-predict-spotlight-pct">{hasVotes ? `${event.pickAPct}%` : "—"}</span>
        </button>

        <div className="bf-predict-spotlight-center">
          <span className="bf-predict-spotlight-vs">VS</span>
          {hasVotes && (
            <span className="bf-predict-spotlight-votes">
              {event.totalVotes.toLocaleString("es-ES")} predicciones
            </span>
          )}
          {!hasVotes && <span className="bf-predict-spotlight-votes">Sé el primero en votar</span>}
          <span className="bf-predict-spotlight-time">
            <Calendar size={12} aria-hidden />
            {formatPredictMatchTime(event.matchDate ?? event.deadline)}
          </span>
        </div>

        <button
          type="button"
          className={`bf-predict-spotlight-side is-b ${pick === "B" ? "is-picked" : ""}`}
          onClick={() => void vote("B")}
          disabled={event.status === "closed" || saving}
        >
          <TeamLogo slug={event.teamBSlug} name={labelB} size={112} glow />
          <strong>{labelB}</strong>
          <span className="bf-predict-spotlight-pct">{hasVotes ? `${event.pickBPct}%` : "—"}</span>
        </button>
      </div>

      {hasVotes && (
        <div className="bf-predict-spotlight-bar" aria-hidden>
          <div className="is-a" style={{ width: `${event.pickAPct}%` }} />
          <div className="is-b" style={{ width: `${event.pickBPct}%` }} />
        </div>
      )}

      <footer className="bf-predict-spotlight-foot">
        {!isLoggedIn && !pick && (
          <Link href="/login?next=/predictions" className="bf-bsc-btn bf-bsc-btn-red">
            Entrar y predecir
          </Link>
        )}
        {saving && <span className="bf-predict-spotlight-msg">Guardando…</span>}
        {pick && !saving && event.status === "open" && (
          <span className="bf-predict-spotlight-msg is-ok">
            Tu pick: <strong>{pick === "A" ? labelA : labelB}</strong>
          </span>
        )}
        {err && <span className="bf-auth-error">{err}</span>}
        <Link href={`/matches/${event.matchId}`} className="bf-predict-spotlight-link">
          Ver ficha del partido
        </Link>
      </footer>
    </section>
  );
}
