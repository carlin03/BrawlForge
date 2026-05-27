"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArenaPanel, FormDots, RankChange, ArenaBadge } from "./ArenaUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { EsportsTeam } from "@/lib/data/teams";
import type { Region } from "@/lib/types";
import { regionLabel, TEAM_REGIONS } from "@/lib/teams-ui";
import { getPlayersByTeam } from "@/lib/data";

export function ArenaTeams({ teams }: { teams: EsportsTeam[] }) {
  const [filter, setFilter] = useState<Region | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"cards" | "list">("cards");

  const sorted = useMemo(() => [...teams].sort((a, b) => a.rank - b.rank), [teams]);
  const list = useMemo(() => {
    let r = filter === "all" ? sorted : sorted.filter((t) => t.region === filter);
    const q = query.trim().toLowerCase();
    if (q) r = r.filter((t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q));
    return r;
  }, [sorted, filter, query]);

  return (
    <>
      <div className="ar-page-head">
        <h1 className="ar-h1">Equipos</h1>
        <p className="ar-lead">{teams.length} organizaciones · ranking global · forma reciente y premios.</p>
      </div>

      <div className="ar-filters">
        <input className="ar-input" placeholder="Buscar club..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className={`ar-filter ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>Todos</button>
        {TEAM_REGIONS.map((r) => (
          <button key={r} type="button" className={`ar-filter ${filter === r ? "is-on" : ""}`} onClick={() => setFilter(r)}>
            {regionLabel(r)}
          </button>
        ))}
        <button type="button" className={`ar-filter ${view === "cards" ? "is-on" : ""}`} onClick={() => setView("cards")}>Cards</button>
        <button type="button" className={`ar-filter ${view === "list" ? "is-on" : ""}`} onClick={() => setView("list")}>Lista</button>
      </div>

      {view === "cards" ? (
        <div className="ar-team-grid">
          {list.map((t) => {
            const roster = getPlayersByTeam(t.slug).slice(0, 3);
            const wins = t.form.filter((f) => f === "W").length;
            const topAch = t.achievements[0];
            return (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="ar-team-card">
                <div className="ar-team-card-head">
                  <span className={`ar-team-rank ${t.rank <= 3 ? "top" : ""}`} style={{ width: 28 }}>{t.rank}</span>
                  <TeamLogo slug={t.slug} name={t.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ar-dim)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <ArenaBadge variant="dim">{t.region}</ArenaBadge>
                      <span>{t.tag}</span>
                      <RankChange delta={t.rankChange} />
                    </div>
                  </div>
                </div>
                {topAch && (
                  <div style={{ fontSize: 11, color: "var(--ar-muted)", padding: "6px 0" }}>
                    🏆 {topAch.place} · {topAch.tournament}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {roster.map((p) => p && (
                    <span key={p.slug} className="ar-pill" style={{ fontSize: 10, padding: "3px 8px" }}>{p.ign}</span>
                  ))}
                </div>
                <div className="ar-team-card-stats">
                  <div className="ar-team-card-stat">
                    <strong style={{ color: "var(--ar-pick)" }}>${(t.earnings / 1000).toFixed(0)}K</strong>
                    <span>Premios</span>
                  </div>
                  <div className="ar-team-card-stat">
                    <strong>{wins}W</strong>
                    <span>Forma</span>
                  </div>
                  <div className="ar-team-card-stat">
                    <FormDots form={t.form} />
                    <span>Últimos</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <ArenaPanel title={`${list.length} equipos`}>
          {list.map((t) => (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="ar-team">
              <span className={`ar-team-rank ${t.rank <= 3 ? "top" : ""}`}>{t.rank}</span>
              <TeamLogo slug={t.slug} name={t.name} size={32} />
              <div className="ar-team-info">
                <div className="ar-team-name">{t.name}</div>
                <div className="ar-team-sub">{t.region} · {t.tag} · ${(t.earnings / 1000).toFixed(0)}K</div>
              </div>
              <FormDots form={t.form} />
              <RankChange delta={t.rankChange} />
            </Link>
          ))}
        </ArenaPanel>
      )}
    </>
  );
}
