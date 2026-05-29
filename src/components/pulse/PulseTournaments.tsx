"use client";

import { useState } from "react";
import Link from "next/link";
import { PulseCard } from "./PulseUI";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { getBscCircuitTournaments } from "@/lib/data";

export function PulseTournaments() {
  const [tab, setTab] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const circuit = getBscCircuitTournaments();
  const live = circuit.filter((t) => t.status === "live");
  const upcoming = circuit.filter((t) => t.status === "upcoming");
  const finished = circuit.filter((t) => t.status === "finished");

  const list =
    tab === "live" ? live.slice(0, 30) :
    tab === "upcoming" ? upcoming.slice(0, 30) :
    tab === "finished" ? finished.slice(0, 30) :
    [...live, ...upcoming].slice(0, 40);

  return (
    <>
      <header className="pl-hero">
        <h1 className="pl-page-title">Torneos</h1>
        <p className="pl-page-sub">{circuit.length.toLocaleString()} competiciones en el calendario BSC</p>
      </header>

      <div className="pl-stats">
        <div className="pl-stat"><div className="pl-stat-val pl-red">{live.length}</div><div className="pl-stat-lbl">Live</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-blue">{upcoming.length}</div><div className="pl-stat-lbl">Próximos</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-gold">{finished.length}</div><div className="pl-stat-lbl">Fin</div></div>
      </div>

      <PulseCard title="Explorar" tabs={
        <div className="pl-tabs">
          <button type="button" className={`pl-tab ${tab === "all" ? "is-on" : ""}`} onClick={() => setTab("all")}>Destacados</button>
          <button type="button" className={`pl-tab ${tab === "live" ? "is-on-red" : ""}`} onClick={() => setTab("live")}>Live</button>
          <button type="button" className={`pl-tab ${tab === "upcoming" ? "is-on" : ""}`} onClick={() => setTab("upcoming")}>Próximos</button>
          <button type="button" className={`pl-tab ${tab === "finished" ? "is-on-gold" : ""}`} onClick={() => setTab("finished")}>Fin</button>
        </div>
      }>
        {list.map((t) => (
          <Link key={t.slug} href={`/tournaments/${t.slug}`} className="pl-row">
            <TournamentLogo slug={t.slug} name={t.shortName} size={32} />
            <div className="pl-row-main">
              <div className="pl-row-title">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
              <div className="pl-row-sub">{t.region} · {t.prizePool} · {t.status}</div>
            </div>
          </Link>
        ))}
      </PulseCard>
    </>
  );
}
