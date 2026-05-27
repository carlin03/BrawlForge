"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PulseCard } from "./PulseUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getActivePlayers, getPlayerPrice, players, searchPlayers } from "@/lib/data";
import { teamName } from "@/lib/data";

export function PulsePlayers() {
  const [query, setQuery] = useState("");
  const active = getActivePlayers().length;
  const list = useMemo(() => {
    const base = query.trim() ? searchPlayers(query) : getActivePlayers();
    return [...base].sort((a, b) => b.rating - a.rating).slice(0, 80);
  }, [query]);

  return (
    <>
      <header className="pl-hero">
        <h1 className="pl-page-title">Jugadores</h1>
        <p className="pl-page-sub">{players.length} pros · {active} activos</p>
      </header>

      <div className="pl-filters">
        <input className="pl-input" placeholder="Buscar IGN..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Link href="/fantasy" className="pl-btn pl-btn-gold">Pro Picks</Link>
      </div>

      <PulseCard title={`${list.length} jugadores`}>
        {list.map((p, i) => (
          p.teamSlug ? (
            <Link key={p.slug} href={`/players/${p.slug}`} className="pl-row">
              <span className={`pl-row-rank ${i < 3 ? "top" : ""}`}>{i + 1}</span>
              <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={32} />
              <div className="pl-row-main">
                <div className="pl-row-title">{p.ign}</div>
                <div className="pl-row-sub">{teamName(p.teamSlug)} · {p.region}</div>
              </div>
              <span className="pl-row-val pl-gold">{p.rating.toFixed(2)}</span>
              <span className="pl-row-val pl-blue" style={{ minWidth: 48, textAlign: "right" }}>{getPlayerPrice(p.slug)}M</span>
            </Link>
          ) : null
        ))}
      </PulseCard>
    </>
  );
}
