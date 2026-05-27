"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NovaPageHero } from "@/components/nova/NovaPageHero";
import { NovaBlock } from "@/components/nova/NovaBlock";
import { ClubRow } from "@/components/esports/ClubRow";
import type { EsportsTeam } from "@/lib/data/teams";
import type { Region } from "@/lib/types";
import { regionLabel, TEAM_REGIONS } from "@/lib/teams-ui";

type Filter = "all" | Region;

export function TeamsHub({ teams }: { teams: EsportsTeam[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...teams].sort((a, b) => a.rank - b.rank), [teams]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = filter === "all" ? sorted : sorted.filter((t) => t.region === filter);
    if (q) list = list.filter((t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q));
    return list;
  }, [filter, sorted, query]);

  return (
    <>
      <NovaPageHero
        kicker="Organizaciones · BSC 2026"
        title="Equipos"
        accent={`${teams.length} clubes.`}
        subtitle="Plantillas, regiones y premios de las orgs competitivas"
        tone="blue"
        actions={<Link href="/rankings" className="nv-btn nv-btn-yellow">Rankings</Link>}
      />
      <div className="nv-filters nv-filters-bar">
        <input className="nv-input" placeholder="Buscar club..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className={`nv-chip ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>Todos</button>
        {TEAM_REGIONS.map((r) => (
          <button key={r} type="button" className={`nv-chip ${filter === r ? "is-on-blue" : ""}`} onClick={() => setFilter(r)}>{regionLabel(r)}</button>
        ))}
        <Link href="/rankings" className="nv-btn nv-btn-line" style={{ marginLeft: "auto" }}>Rankings</Link>
      </div>
      <NovaBlock title={`${filtered.length} equipos`}>
        <table className="es-table es-table-premium">
          <thead>
            <tr>
              <th>#</th>
              <th>Organización</th>
              <th>Región</th>
              <th>Forma</th>
              <th style={{ textAlign: "right" }}>Premios</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <ClubRow key={t.slug} team={t} />
            ))}
          </tbody>
        </table>
      </NovaBlock>
    </>
  );
}
