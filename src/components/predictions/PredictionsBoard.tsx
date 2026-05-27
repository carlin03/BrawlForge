"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NovaPageHero } from "@/components/nova/NovaPageHero";
import { NovaBlock } from "@/components/nova/NovaBlock";
import { PredictionMatchCard } from "@/components/predictions/PredictionMatchCard";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getPredictionTournament, userPredictorProfile, isKnownTeamSlug } from "@/lib/data";

export function PredictionsBoard({ open, closed }: { open: PredictionEvent[]; closed: PredictionEvent[] }) {
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
  const [active, setActive] = useState("all");
  const filtered = active === "all" ? displayOpen : displayOpen.filter((e) => e.tournamentSlug === active);
  const featured = filtered.filter((e) => e.featured);
  const rest = filtered.filter((e) => !e.featured);

  return (
    <>
      <NovaPageHero
        kicker="Community picks · BSC"
        title="Vota"
        accent="Gana puntos."
        subtitle={`${displayOpen.length} votaciones abiertas · ${userPredictorProfile.accuracy}% precisión · racha ${userPredictorProfile.streak}`}
        tone="red"
        actions={
          <>
            <Link href="/pickems" className="nv-btn nv-btn-yellow">Pick&apos;em</Link>
            <Link href="/matches" className="nv-btn nv-btn-blue">Partidos</Link>
          </>
        }
      />

      <div className="nv-kpis">
        <div className="nv-kpi"><div className="nv-kpi-val c-yellow">{userPredictorProfile.totalPoints}</div><div className="nv-kpi-lbl">Puntos</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-blue">#{userPredictorProfile.rank}</div><div className="nv-kpi-lbl">Rank global</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-red">{userPredictorProfile.accuracy}%</div><div className="nv-kpi-lbl">Precisión</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val">{userPredictorProfile.streak}</div><div className="nv-kpi-lbl">Racha</div></div>
      </div>

      <div className="nv-filters nv-filters-bar">
        <button type="button" className={`nv-chip ${active === "all" ? "is-on-red" : ""}`} onClick={() => setActive("all")}>
          Todos ({displayOpen.length})
        </button>
        {tournaments.map(([slug, name]) => (
          <button key={slug} type="button" className={`nv-chip ${active === slug ? "is-on-red" : ""}`} onClick={() => setActive(slug)}>
            {name}
          </button>
        ))}
      </div>

      {featured.length > 0 && (
        <NovaBlock title="Destacados">
          <div className="pm-grid pm-grid-featured">
            {featured.map((e) => (
              <PredictionMatchCard key={e.id} event={e} featured />
            ))}
          </div>
        </NovaBlock>
      )}

      <div style={{ marginTop: featured.length > 0 ? 14 : 0 }}>
        <NovaBlock title={`Abiertos · ${rest.length}`}>
          <div className="pm-grid">
            {rest.map((e) => (
              <PredictionMatchCard key={e.id} event={e} />
            ))}
            {filtered.length === 0 && (
              <p className="nv-dim" style={{ padding: 24, textAlign: "center", margin: 0 }}>No hay votaciones para este filtro.</p>
            )}
          </div>
        </NovaBlock>
      </div>

      {displayClosed.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <NovaBlock title="Recientes" linkText="">
            <div className="pm-grid pm-grid-compact">
              {displayClosed.slice(0, 6).map((e) => (
                <PredictionMatchCard key={e.id} event={e} />
              ))}
            </div>
          </NovaBlock>
        </div>
      )}
    </>
  );
}
