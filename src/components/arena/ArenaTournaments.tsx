"use client";

import { useState } from "react";
import Link from "next/link";
import { ArenaPanel } from "./ArenaUI";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { getBscCircuitTournaments, hasFantasyForTournament } from "@/lib/data";

export function ArenaTournaments() {
  const [tab, setTab] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const circuit = getBscCircuitTournaments();
  const live = circuit.filter((t) => t.status === "live");
  const upcoming = circuit.filter((t) => t.status === "upcoming");
  const finished = circuit.filter((t) => t.status === "finished");
  const list =
    tab === "live" ? live.slice(0, 24) :
    tab === "upcoming" ? upcoming.slice(0, 24) :
    tab === "finished" ? finished.slice(0, 24) :
    [...live, ...upcoming].slice(0, 30);

  return (
    <>
      <h1 className="ar-h1">Torneos</h1>
      <p className="ar-lead">{circuit.length.toLocaleString()} eventos en el calendario BSC.</p>

      <div className="ar-filters">
        <button type="button" className={`ar-filter ${tab === "all" ? "is-on" : ""}`} onClick={() => setTab("all")}>Destacados</button>
        <button type="button" className={`ar-filter ${tab === "live" ? "is-on" : ""}`} onClick={() => setTab("live")}>En curso ({live.length})</button>
        <button type="button" className={`ar-filter ${tab === "upcoming" ? "is-on" : ""}`} onClick={() => setTab("upcoming")}>Próximos</button>
        <button type="button" className={`ar-filter ${tab === "finished" ? "is-on" : ""}`} onClick={() => setTab("finished")}>Finalizados</button>
      </div>

      <ArenaPanel title={`${list.length} torneos`}>
        {list.map((t) => {
          const hasFantasy = hasFantasyForTournament(t.slug);
          return (
            <div key={t.slug} className="ar-team" style={{ padding: 0 }}>
              <Link href={`/tournaments/${t.slug}`} className="ar-team" style={{ flex: 1, borderBottom: "none" }}>
                <TournamentLogo slug={t.slug} name={t.shortName} size={32} />
                <div className="ar-team-info">
                  <div className="ar-team-name">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
                  <div className="ar-team-sub">{t.region} · {t.prizePool} · {t.status}</div>
                </div>
              </Link>
              {hasFantasy && (
                <Link href={`/fantasy?tournament=${t.slug}`} className="ar-badge ar-badge-gold" style={{ marginRight: 16, textDecoration: "none" }}>
                  Fantasy
                </Link>
              )}
            </div>
          );
        })}
      </ArenaPanel>
    </>
  );
}
