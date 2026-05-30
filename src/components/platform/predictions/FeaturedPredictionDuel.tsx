"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Flame, Radio, Trophy } from "lucide-react";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { formatPredictMatchTime } from "@/lib/data/predictions-ui";
import { getPredictionLabel } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import { getMatch } from "@/lib/data/matches";
import { featuredLabelFromMeta, parseMatchMeta } from "@/lib/data/match-meta";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { MatchStageBadge } from "@/components/platform/predictions/MatchStageBadge";
import { MatchStatusPill } from "@/components/platform/predictions/MatchStatusPill";

/** Partido destacado / de la semana — premium Pick'em (configurable en admin). */
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
  const tour = event.tournamentShortName ?? event.tournamentSlug;
  const meta = event.stageMeta;
  const tierClass = meta?.cardClass ?? "is-tier-3";
  const featuredKicker = featuredLabelFromMeta(
    parseMatchMeta(getMatch(event.matchId)?.meta),
  );

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
    <section
      className={`bf-predict-featured-premium ${tierClass}`}
      aria-labelledby="predict-featured-title"
    >
      <div className="bf-predict-featured-premium-glow" aria-hidden />
      <div className="bf-predict-featured-premium-inner">
        <header className="bf-predict-featured-premium-head">
          <div className="bf-predict-featured-premium-kickers">
            <span className="bf-predict-featured-day-badge">
              <Flame size={14} aria-hidden /> {featuredKicker}
            </span>
            {event.displayStatus && <MatchStatusPill status={event.displayStatus} />}
          </div>
          <div className="bf-predict-featured-premium-tourney">
            <TournamentLogo slug={event.tournamentSlug} name={tour} size={28} glow />
            <div>
              <p id="predict-featured-title" className="bf-predict-featured-tourney-name">
                <Trophy size={14} aria-hidden /> {tour}
              </p>
              <p className="bf-predict-featured-tourney-sub">
                {meta?.fullLabel ?? event.stage}
                {event.region ? ` · ${event.region}` : ""}
              </p>
            </div>
          </div>
          <div className="bf-predict-featured-premium-meta-row">
            {meta && <MatchStageBadge meta={meta} large />}
            <span className="bf-predict-featured-time">
              <Calendar size={12} aria-hidden />
              {formatPredictMatchTime(event.matchDate ?? event.deadline)}
            </span>
            <span className="bf-predict-featured-pts">+{event.rewardPoints} pts</span>
          </div>
          {meta?.stakesLine && <p className="bf-predict-featured-stakes">{meta.stakesLine}</p>}
        </header>

        <div className="bf-predict-featured-premium-arena">
          <button
            type="button"
            className={`bf-predict-fp-side is-a ${pick === "A" ? "is-picked" : ""}`}
            onClick={() => void vote("A")}
            disabled={event.status === "closed" || saving}
          >
          <span className="bf-predict-fp-logo">
            <TeamLogo slug={event.teamASlug} name={labelA} size={80} glow />
          </span>
          <span className="bf-predict-fp-name" title={labelA}>
            {labelA}
          </span>
            <span className="bf-predict-fp-pct">{hasVotes ? `${event.pickAPct}%` : "—"}</span>
          </button>

          <div className="bf-predict-fp-mid">
            <span className="bf-predict-fp-vs">VS</span>
            {hasVotes ? (
              <>
                <span className="bf-predict-fp-split">
                  {event.pickAPct}% <span>vs</span> {event.pickBPct}%
                </span>
                <span className="bf-predict-fp-votes">
                  {event.totalVotes.toLocaleString("es-ES")} predicciones
                </span>
              </>
            ) : (
              <span className="bf-predict-fp-votes">Sé el primero en predecir</span>
            )}
            {event.matchStatus === "live" && (
              <span className="bf-predict-fp-live">
                <Radio size={11} aria-hidden /> EN DIRECTO
              </span>
            )}
          </div>

          <button
            type="button"
            className={`bf-predict-fp-side is-b ${pick === "B" ? "is-picked" : ""}`}
            onClick={() => void vote("B")}
            disabled={event.status === "closed" || saving}
          >
          <span className="bf-predict-fp-logo">
            <TeamLogo slug={event.teamBSlug} name={labelB} size={80} glow />
          </span>
          <span className="bf-predict-fp-name" title={labelB}>
            {labelB}
          </span>
            <span className="bf-predict-fp-pct">{hasVotes ? `${event.pickBPct}%` : "—"}</span>
          </button>
        </div>

        {hasVotes && (
          <div className="bf-predict-featured-premium-bar" aria-hidden>
            <div className="is-a" style={{ width: `${event.pickAPct}%` }} />
            <div className="is-b" style={{ width: `${event.pickBPct}%` }} />
          </div>
        )}

        <footer className="bf-predict-featured-premium-foot">
          {pick && !saving && event.status === "open" && (
            <span className="bf-predict-fp-pick">
              Tu pick: <strong>{pick === "A" ? labelA : labelB}</strong>
            </span>
          )}
          {saving && <span className="bf-predict-fp-pick">Guardando…</span>}
          {err && <span className="bf-auth-error">{err}</span>}
          {!isLoggedIn && !pick && (
            <Link href="/login?next=/predictions" className="bf-predict-fp-login">
              Entrar para votar
            </Link>
          )}
          <Link href={`/matches/${event.matchId}`} className="bf-predict-fp-link">
            Ver ficha del partido
          </Link>
        </footer>
      </div>
    </section>
  );
}
