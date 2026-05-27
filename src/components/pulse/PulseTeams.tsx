"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PulseCard } from "./PulseUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { EsportsTeam } from "@/lib/data/teams";
import type { Region } from "@/lib/types";
import { regionLabel, TEAM_REGIONS } from "@/lib/teams-ui";

export function PulseTeams({ teams }: { teams: EsportsTeam[] }) {
  const [filter, setFilter] = useState<Region | "all">("all");
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...teams].sort((a, b) => a.rank - b.rank), [teams]);
  const list = useMemo(() => {
    let r = filter === "all" ? sorted : sorted.filter((t) => t.region === filter);
    const q = query.trim().toLowerCase();
    if (q) r = r.filter((t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q));
    return r;
  }, [sorted, filter, query]);

  return (
    <>
      <header className="pl-hero">
        <h1 className="pl-page-title">Equipos</h1>
        <p className="pl-page-sub">{teams.length} organizaciones BSC</p>
      </header>

      <div className="pl-filters">
        <input className="pl-input" placeholder="Buscar club..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className={`pl-chip ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>Todos</button>
        {TEAM_REGIONS.map((r) => (
          <button key={r} type="button" className={`pl-chip ${filter === r ? "is-on-blue" : ""}`} onClick={() => setFilter(r)}>{regionLabel(r)}</button>
        ))}
      </div>

      <PulseCard title={`${list.length} equipos`}>
        {list.map((t) => (
          <Link key={t.slug} href={`/teams/${t.slug}`} className="pl-row">
            <span className={`pl-row-rank ${t.rank <= 3 ? "top" : ""}`}>{t.rank}</span>
            <TeamLogo slug={t.slug} name={t.name} size={36} />
            <div className="pl-row-main">
              <div className="pl-row-title">{t.name}</div>
              <div className="pl-row-sub">{t.region} · {t.country}</div>
            </div>
            <span className="pl-row-val pl-gold">{t.tag}</span>
          </Link>
        ))}
      </PulseCard>
    </>
  );
}
