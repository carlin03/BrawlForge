"use client";

import { useMemo, useState } from "react";
import { PulseCard, PulseMatchRow } from "./PulseUI";
import { getCuratedHomeMatches, getLiveMatches, getUpcomingMatches, isKnownTeamSlug } from "@/lib/data";

export function PulseMatches() {
  const live = getLiveMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const upcoming = getUpcomingMatches().filter((m) => isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug));
  const [tab, setTab] = useState<"live" | "upcoming" | "results">(live.length ? "live" : "results");
  const matches = useMemo(() => getCuratedHomeMatches(tab, 20), [tab]);

  return (
    <>
      <header className="pl-hero">
        <h1 className="pl-page-title">Partidos</h1>
        <p className="pl-page-sub">Solo equipos confirmados — sin placeholders.</p>
      </header>

      <div className="pl-stats">
        <div className="pl-stat"><div className="pl-stat-val pl-red">{live.length}</div><div className="pl-stat-lbl">Live</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-blue">{upcoming.length}</div><div className="pl-stat-lbl">Próximos</div></div>
      </div>

      <PulseCard title="Calendario" tabs={
        <div className="pl-tabs">
          <button type="button" className={`pl-tab ${tab === "live" ? "is-on-red" : ""}`} onClick={() => setTab("live")}>Live</button>
          <button type="button" className={`pl-tab ${tab === "upcoming" ? "is-on" : ""}`} onClick={() => setTab("upcoming")}>Próximos</button>
          <button type="button" className={`pl-tab ${tab === "results" ? "is-on-gold" : ""}`} onClick={() => setTab("results")}>Resultados</button>
        </div>
      }>
        {matches.map((m) => <PulseMatchRow key={m.id} match={m} />)}
        {!matches.length && <div className="pl-empty">Sin partidos en esta categoría.</div>}
      </PulseCard>
    </>
  );
}
