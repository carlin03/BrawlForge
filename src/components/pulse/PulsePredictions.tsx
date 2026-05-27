"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PulseCard } from "./PulseUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { PredictionEvent } from "@/lib/data/predictions";
import {
  getPredictionLabel,
  getPredictionTournament,
  userPredictorProfile,
  isKnownTeamSlug,
  teamName,
} from "@/lib/data";

export function PulsePredictions({ open, closed }: { open: PredictionEvent[]; closed: PredictionEvent[] }) {
  const displayOpen = useMemo(() => open.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)), [open]);
  const displayClosed = useMemo(() => closed.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)), [closed]);

  const tournaments = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of displayOpen) map.set(e.tournamentSlug, getPredictionTournament(e));
    return [...map.entries()];
  }, [displayOpen]);

  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? displayOpen : displayOpen.filter((e) => e.tournamentSlug === filter);

  return (
    <>
      <header className="pl-hero">
        <div className="pl-hero-badge" style={{ background: "var(--pl-red-soft)", color: "var(--pl-red)", borderColor: "rgba(255,71,87,0.2)" }}>
          Community vote
        </div>
        <h1 className="pl-page-title">Vota</h1>
        <p className="pl-page-sub">Elige ganador y suma puntos. Simple y claro.</p>
      </header>

      <div className="pl-stats">
        <div className="pl-stat"><div className="pl-stat-val pl-gold">{userPredictorProfile.totalPoints}</div><div className="pl-stat-lbl">Puntos</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-blue">#{userPredictorProfile.rank}</div><div className="pl-stat-lbl">Rank</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-red">{userPredictorProfile.accuracy}%</div><div className="pl-stat-lbl">Aciertos</div></div>
      </div>

      <div className="pl-filters">
        <button type="button" className={`pl-chip ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>Todos</button>
        {tournaments.map(([slug, name]) => (
          <button key={slug} type="button" className={`pl-chip ${filter === slug ? "is-on" : ""}`} onClick={() => setFilter(slug)}>{name}</button>
        ))}
        <Link href="/pickems" className="pl-btn pl-btn-ghost" style={{ marginLeft: "auto" }}>Pick&apos;em</Link>
      </div>

      <PulseCard title={`Abiertas · ${list.length}`}>
        {list.map((e) => (
          <div key={e.id} className="pl-vote">
            <div className="pl-vote-meta">{getPredictionTournament(e)} · {e.stage} · +{e.rewardPoints} pts</div>
            <div className="pl-vote-clash">
              <div className="pl-vote-side">
                <button type="button">
                  <TeamLogo slug={e.teamASlug} name={teamName(e.teamASlug)} size={44} />
                  <div style={{ fontWeight: 700, marginTop: 10 }}>{getPredictionLabel(e, "A")}</div>
                </button>
                <div className="pl-vote-pct pl-blue">{e.pickAPct}%</div>
              </div>
              <span className="pl-match-vs">VS</span>
              <div className="pl-vote-side">
                <button type="button">
                  <TeamLogo slug={e.teamBSlug} name={teamName(e.teamBSlug)} size={44} />
                  <div style={{ fontWeight: 700, marginTop: 10 }}>{getPredictionLabel(e, "B")}</div>
                </button>
                <div className="pl-vote-pct pl-red">{e.pickBPct}%</div>
              </div>
            </div>
          </div>
        ))}
        {!list.length && <div className="pl-empty">No hay votaciones abiertas.</div>}
      </PulseCard>

      {displayClosed.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <PulseCard title="Recientes">
            {displayClosed.slice(0, 5).map((e) => (
              <div key={e.id} className="pl-vote">
                <div className="pl-vote-meta">{getPredictionTournament(e)} · {e.stage}</div>
                <div className="pl-vote-clash">
                  <div className="pl-vote-side">
                    <TeamLogo slug={e.teamASlug} name={teamName(e.teamASlug)} size={32} />
                    <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>{getPredictionLabel(e, "A")}</div>
                  </div>
                  <span className="pl-dim">vs</span>
                  <div className="pl-vote-side">
                    <TeamLogo slug={e.teamBSlug} name={teamName(e.teamBSlug)} size={32} />
                    <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>{getPredictionLabel(e, "B")}</div>
                  </div>
                </div>
              </div>
            ))}
          </PulseCard>
        </div>
      )}
    </>
  );
}
