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

/** Partido destacado compacto — no domina la página. */
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
    <section className="bf-predict-featured-compact" aria-labelledby="predict-featured-title">
      <div className="bf-predict-featured-compact-head">
        <p id="predict-featured-title" className="bf-predict-featured-compact-kicker">
          <Target size={12} aria-hidden /> Destacado del día
        </p>
        <div className="bf-predict-featured-compact-meta">
          <TournamentLogo slug={event.tournamentSlug} name={tour} size={22} glow={false} />
          <span>{tour}</span>
          <span>·</span>
          <span>{event.stage}</span>
          <span className="bf-predict-featured-compact-time">
            <Calendar size={11} aria-hidden />
            {formatPredictMatchTime(event.matchDate ?? event.deadline)}
          </span>
        </div>
        <div className="bf-predict-featured-compact-badges">
          {isLive && (
            <span className="bf-predict-featured-compact-live">
              <Radio size={10} aria-hidden /> LIVE
            </span>
          )}
          <span className="bf-predict-featured-compact-pts">+{event.rewardPoints}</span>
        </div>
      </div>

      <div className="bf-predict-featured-compact-arena">
        <button
          type="button"
          className={`bf-predict-fc-side is-a ${pick === "A" ? "is-picked" : ""}`}
          onClick={() => void vote("A")}
          disabled={event.status === "closed" || saving}
        >
          <TeamLogo slug={event.teamASlug} name={labelA} size={52} glow={false} />
          <span className="bf-predict-fc-name">{labelA}</span>
          <span className="bf-predict-fc-pct">{hasVotes ? `${event.pickAPct}%` : "—"}</span>
        </button>

        <div className="bf-predict-fc-mid">
          <span className="bf-predict-fc-vs">VS</span>
          {hasVotes ? (
            <span className="bf-predict-fc-votes">{event.totalVotes.toLocaleString("es-ES")} votos</span>
          ) : (
            <span className="bf-predict-fc-votes">Sé el primero</span>
          )}
        </div>

        <button
          type="button"
          className={`bf-predict-fc-side is-b ${pick === "B" ? "is-picked" : ""}`}
          onClick={() => void vote("B")}
          disabled={event.status === "closed" || saving}
        >
          <TeamLogo slug={event.teamBSlug} name={labelB} size={52} glow={false} />
          <span className="bf-predict-fc-name">{labelB}</span>
          <span className="bf-predict-fc-pct">{hasVotes ? `${event.pickBPct}%` : "—"}</span>
        </button>
      </div>

      {hasVotes && (
        <div className="bf-predict-featured-compact-bar" aria-hidden>
          <div className="is-a" style={{ width: `${event.pickAPct}%` }} />
          <div className="is-b" style={{ width: `${event.pickBPct}%` }} />
        </div>
      )}

      <footer className="bf-predict-featured-compact-foot">
        {pick && !saving && event.status === "open" && (
          <span className="bf-predict-fc-pick">
            Tu pick: <strong>{pick === "A" ? labelA : labelB}</strong>
          </span>
        )}
        {saving && <span className="bf-predict-fc-pick">Guardando…</span>}
        {err && <span className="bf-auth-error">{err}</span>}
        {!isLoggedIn && !pick && (
          <Link href="/login?next=/predictions" className="bf-predict-fc-login">
            Entrar para votar
          </Link>
        )}
        <Link href={`/matches/${event.matchId}`} className="bf-predict-fc-link">
          Ficha
        </Link>
      </footer>
    </section>
  );
}
