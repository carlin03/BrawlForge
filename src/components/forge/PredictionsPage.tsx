"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Block, Chip, StatStrip } from "./ui";
import type { PredictionEvent } from "@/lib/data/predictions";
import {
  getPredictionLabel,
  getPredictionTournament,
  userPredictorProfile,
  isKnownTeamSlug,
  teamName,
  getTopPredictors,
} from "@/lib/data";

function Poll({ event }: { event: PredictionEvent }) {
  const correct = event.status === "closed" && event.correctPick;
  return (
    <div className="fg-poll">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "var(--fg-dim)", fontWeight: 600 }}>
          {getPredictionTournament(event)} · {event.stage} · +{event.rewardPoints} pts
        </span>
        <span style={{ fontSize: 11, color: "var(--fg-dim)" }}>{(event.totalVotes / 1000).toFixed(1)}K votos</span>
      </div>
      <div className="fg-poll-options">
        <button type="button" className="fg-poll-opt">
          <TeamLogo slug={event.teamASlug} name={teamName(event.teamASlug)} size={36} />
          <span style={{ fontWeight: 600, fontSize: 12 }}>{getPredictionLabel(event, "A")}</span>
          {correct === "A" && <Chip variant="gold">✓</Chip>}
        </button>
        <button type="button" className="fg-poll-opt">
          <TeamLogo slug={event.teamBSlug} name={teamName(event.teamBSlug)} size={36} />
          <span style={{ fontWeight: 600, fontSize: 12 }}>{getPredictionLabel(event, "B")}</span>
          {correct === "B" && <Chip variant="gold">✓</Chip>}
        </button>
      </div>
      <div className="fg-poll-bar">
        <div className="fg-poll-bar-a" style={{ width: `${event.pickAPct}%` }} />
        <div className="fg-poll-bar-b" style={{ width: `${event.pickBPct}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-dim)", marginTop: 6 }}>
        <span>{event.pickAPct}% {getPredictionLabel(event, "A")}</span>
        <span>{event.pickBPct}%</span>
      </div>
    </div>
  );
}

export function ForgePredictions({ open, closed }: { open: PredictionEvent[]; closed: PredictionEvent[] }) {
  const displayOpen = useMemo(() => open.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)), [open]);
  const displayClosed = useMemo(() => closed.filter((e) => isKnownTeamSlug(e.teamASlug) && isKnownTeamSlug(e.teamBSlug)), [closed]);
  const [filter, setFilter] = useState("all");
  const tournaments = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of displayOpen) m.set(e.tournamentSlug, getPredictionTournament(e));
    return [...m.entries()];
  }, [displayOpen]);
  const list = filter === "all" ? displayOpen : displayOpen.filter((e) => e.tournamentSlug === filter);
  const predictors = getTopPredictors(6);
  const ptsToNext = userPredictorProfile.nextRewardTier - userPredictorProfile.totalPoints;

  return (
    <>
      <h1 className="fg-h1">Predicciones</h1>
      <p className="fg-lead">Vota resultados, sube en el ranking y mantén tu racha de aciertos.</p>

      <StatStrip
        items={[
          { label: "Tus puntos", value: String(userPredictorProfile.totalPoints), accent: "var(--fg-blue-bright)" },
          { label: "Ranking", value: `#${userPredictorProfile.rank}` },
          { label: "Aciertos", value: `${userPredictorProfile.accuracy}%` },
          { label: "Racha", value: String(userPredictorProfile.streak), accent: "var(--fg-gold)" },
        ]}
      />

      <div className="fg-streak">
        <div className="fg-streak-num">{userPredictorProfile.streak}</div>
        <div>
          <div style={{ fontWeight: 700 }}>Racha activa</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
            {ptsToNext > 0 ? `${ptsToNext} pts al siguiente tier · ` : ""}
            +{Math.min(userPredictorProfile.streak * 5, 25)} bonus por racha
          </div>
        </div>
      </div>

      <div className="fg-predict-layout">
        <div>
          <div className="fg-filters">
            <button type="button" className={`fg-filter ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>Todos</button>
            {tournaments.map(([slug, name]) => (
              <button key={slug} type="button" className={`fg-filter ${filter === slug ? "is-on" : ""}`} onClick={() => setFilter(slug)}>{name}</button>
            ))}
          </div>
          <Block title={`${list.length} abiertas`}>
            {list.length ? list.map((e) => <Poll key={e.id} event={e} />) : (
              <div className="fg-empty">No hay votaciones abiertas.</div>
            )}
          </Block>
          {displayClosed.length > 0 && (
            <div style={{ marginTop: "var(--fg-gap-lg)" }}>
              <Block title="Resultados recientes">
                {displayClosed.slice(0, 6).map((e) => <Poll key={e.id} event={e} />)}
              </Block>
            </div>
          )}
        </div>

        <Block title="Top predictors">
          {predictors.map((p, i) => (
            <div key={p.username} className="fg-row" style={{ cursor: "default" }}>
              <span className={`fg-rank ${i < 3 ? "top" : ""}`}>{i + 1}</span>
              <div className="fg-row-main">
                <div className="fg-row-title">{p.username}</div>
                <div className="fg-row-sub">{p.accuracy}% aciertos · racha {p.streak}</div>
              </div>
              <span className="fg-row-stat">{p.points}</span>
            </div>
          ))}
        </Block>
      </div>
    </>
  );
}
