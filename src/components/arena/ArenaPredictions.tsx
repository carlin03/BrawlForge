"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { ArenaPanel, ArenaBadge, RankChange } from "./ArenaUI";
import type { PredictionEvent } from "@/lib/data/predictions";
import {
  getPredictionLabel,
  getPredictionTournament,
  userPredictorProfile,
  isKnownTeamSlug,
  teamName,
  getTopPredictors,
} from "@/lib/data";

function PollCard({ event, compact }: { event: PredictionEvent; compact?: boolean }) {
  const correct = event.status === "closed" && event.correctPick;
  return (
    <div className="ar-poll" style={compact ? { padding: "14px 16px" } : undefined}>
      <div className="ar-poll-meta" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <span>
          {getPredictionTournament(event)}
          {!compact && event.stage ? ` · ${event.stage}` : ""}
          {!compact && ` · +${event.rewardPoints} pts`}
        </span>
        {!compact && <span>{(event.totalVotes / 1000).toFixed(1)}K votos</span>}
      </div>
      <div className="ar-poll-teams">
        <button type="button" className="ar-poll-btn" style={compact ? { padding: "12px 10px" } : undefined}>
          <TeamLogo slug={event.teamASlug} name={teamName(event.teamASlug)} size={compact ? 32 : 40} />
          <span className="ar-poll-btn-name">{getPredictionLabel(event, "A")}</span>
          {correct === "A" && <ArenaBadge variant="green">✓</ArenaBadge>}
        </button>
        <button type="button" className="ar-poll-btn" style={compact ? { padding: "12px 10px" } : undefined}>
          <TeamLogo slug={event.teamBSlug} name={teamName(event.teamBSlug)} size={compact ? 32 : 40} />
          <span className="ar-poll-btn-name">{getPredictionLabel(event, "B")}</span>
          {correct === "B" && <ArenaBadge variant="green">✓</ArenaBadge>}
        </button>
      </div>
      <div className="ar-poll-bar">
        <div className="ar-poll-bar-a" style={{ width: `${event.pickAPct}%` }} />
        <div className="ar-poll-bar-b" style={{ width: `${event.pickBPct}%` }} />
      </div>
      <div className="ar-poll-pcts">
        <span>{event.pickAPct}% eligen {getPredictionLabel(event, "A")}</span>
        <span>{event.pickBPct}%</span>
      </div>
    </div>
  );
}

export function ArenaPredictions({ open, closed }: { open: PredictionEvent[]; closed: PredictionEvent[] }) {
  const displayOpen = useMemo(
    () => open.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)),
    [open],
  );
  const displayClosed = useMemo(
    () => closed.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)),
    [closed],
  );

  const tournaments = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of displayOpen) map.set(e.tournamentSlug, getPredictionTournament(e));
    return [...map.entries()];
  }, [displayOpen]);

  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? displayOpen : displayOpen.filter((e) => e.tournamentSlug === filter);
  const topPredictors = getTopPredictors(5);
  const recentCorrect = displayClosed.filter((e) => e.correctPick).slice(0, 4);
  const ptsToNext = userPredictorProfile.nextRewardTier - userPredictorProfile.totalPoints;

  return (
    <>
      <section className="ar-hero">
        <div className="ar-hero-inner">
          <div className="ar-hero-kicker" style={{ background: "var(--ar-vote-soft)", color: "var(--ar-vote)", borderColor: "rgba(94,184,255,0.35)" }}>
            Votaciones · racha activa
          </div>
          <h1 className="ar-h1">
            Elige al<br /><span className="ar-h1-gold">ganador.</span>
          </h1>
          <p className="ar-lead" style={{ marginBottom: 0 }}>
            Suma puntos, sube en el ranking y desbloquea recompensas. {ptsToNext > 0 ? `${ptsToNext} pts al siguiente tier.` : "Tier máximo alcanzado."}
          </p>
        </div>
      </section>

      <div className="ar-meta-row">
        <div className="ar-meta-item">
          <strong className="gold">{userPredictorProfile.totalPoints}</strong>
          <span>Tus puntos</span>
        </div>
        <div className="ar-meta-item">
          <strong>#{userPredictorProfile.rank}</strong>
          <span>Ranking</span>
        </div>
        <div className="ar-meta-item">
          <strong className="gold">{userPredictorProfile.accuracy}%</strong>
          <span>Aciertos</span>
        </div>
        <div className="ar-meta-item">
          <strong style={{ color: "var(--ar-vote)" }}>{userPredictorProfile.streak}</strong>
          <span>Racha</span>
        </div>
      </div>

      <div className="ar-streak-bar">
        <div className="ar-streak-num">{userPredictorProfile.streak}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Racha de aciertos</div>
          <div style={{ fontSize: 12, color: "var(--ar-dim)" }}>Cada acierto consecutivo suma bonus · próximo tier a {userPredictorProfile.nextRewardTier} pts</div>
        </div>
        <ArenaBadge variant="blue">+{Math.min(userPredictorProfile.streak * 5, 25)} bonus</ArenaBadge>
      </div>

      <div className="ar-dash-grid-2">
        <ArenaPanel title={`${list.length} abiertas`}>
          <div className="ar-filters" style={{ margin: 0, padding: "10px 16px", borderBottom: "1px solid var(--ar-line)" }}>
            <button type="button" className={`ar-filter ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>
              Todos
            </button>
            {tournaments.map(([slug, name]) => (
              <button key={slug} type="button" className={`ar-filter ${filter === slug ? "is-on" : ""}`} onClick={() => setFilter(slug)}>
                {name}
              </button>
            ))}
          </div>
          {list.length ? list.map((e) => <PollCard key={e.id} event={e} />) : (
            <div className="ar-empty">No quedan votaciones abiertas.</div>
          )}
        </ArenaPanel>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ar-gap-lg)" }}>
          <ArenaPanel title="Top predictors" compact>
            {topPredictors.map((p, i) => (
              <div key={p.username} className="ar-compact-row" style={{ cursor: "default" }}>
                <span className="ar-compact-stat" style={{ width: 24, color: i < 3 ? "var(--ar-pick)" : "var(--ar-dim)" }}>{i + 1}</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.avatarColor, flexShrink: 0 }} />
                <div className="ar-compact-main">
                  <div className="ar-compact-title">{p.username}</div>
                  <div className="ar-compact-sub">{p.accuracy}% aciertos · racha {p.streak}</div>
                </div>
                <RankChange delta={p.rankChange} />
                <span className="ar-compact-stat" style={{ color: "var(--ar-vote)" }}>{p.points}</span>
              </div>
            ))}
          </ArenaPanel>

          <ArenaPanel title="Aciertos recientes" compact>
            {recentCorrect.length ? recentCorrect.map((e) => (
              <div key={e.id} className="ar-compact-row" style={{ cursor: "default" }}>
                <ArenaBadge variant="green">✓</ArenaBadge>
                <div className="ar-compact-main">
                  <div className="ar-compact-title">{getPredictionLabel(e, e.correctPick!)}</div>
                  <div className="ar-compact-sub">{getPredictionTournament(e)} · {e.pickAPct}% community pick</div>
                </div>
                <span className="ar-compact-stat">+{e.rewardPoints}</span>
              </div>
            )) : (
              <div className="ar-empty">Sin historial reciente.</div>
            )}
          </ArenaPanel>
        </div>
      </div>

      {displayClosed.length > 0 && (
        <div style={{ marginTop: "var(--ar-gap-lg)" }}>
          <ArenaPanel title="Historial reciente">
            {displayClosed.slice(0, 8).map((e) => (
              <PollCard key={e.id} event={e} compact />
            ))}
          </ArenaPanel>
        </div>
      )}

      <p style={{ marginTop: 20, fontSize: 13, color: "var(--ar-dim)" }}>
        ¿Prefieres brackets completos?{" "}
        <Link href="/pickems" style={{ color: "var(--ar-vote)" }}>Pick&apos;em de torneos</Link>
      </p>
    </>
  );
}
