"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Block, Chip, FormDots, StatStrip } from "./ui";
import type { EsportsTeam } from "@/lib/data/teams";
import type { Region } from "@/lib/types";
import { regionLabel, TEAM_REGIONS } from "@/lib/teams-ui";
import { getPlayersByTeam, getPickRate, getPlayerPrice } from "@/lib/data";

export function ForgeTeams({ teams }: { teams: EsportsTeam[] }) {
  const [filter, setFilter] = useState<Region | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "ranking">("ranking");

  const sorted = useMemo(() => [...teams].sort((a, b) => a.rank - b.rank), [teams]);
  const list = useMemo(() => {
    let r = filter === "all" ? sorted : sorted.filter((t) => t.region === filter);
    const q = query.trim().toLowerCase();
    if (q) r = r.filter((t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q));
    return r;
  }, [sorted, filter, query]);

  return (
    <>
      <h1 className="fg-h1">Equipos</h1>
      <p className="fg-lead">Ranking competitivo, forma reciente y contexto fantasy — sin tablas enciclopédicas.</p>

      <StatStrip
        items={[
          { label: "Equipos", value: String(teams.length) },
          { label: "Regiones", value: String(TEAM_REGIONS.length) },
          { label: "#1", value: sorted[0]?.tag ?? "—", accent: "var(--fg-gold)" },
        ]}
      />

      <div className="fg-filters">
        <input className="fg-input" placeholder="Buscar club..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className={`fg-filter ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>Todos</button>
        {TEAM_REGIONS.map((r) => (
          <button key={r} type="button" className={`fg-filter ${filter === r ? "is-on" : ""}`} onClick={() => setFilter(r)}>{regionLabel(r)}</button>
        ))}
        <button type="button" className={`fg-filter ${view === "ranking" ? "is-on" : ""}`} onClick={() => setView("ranking")}>Ranking</button>
        <button type="button" className={`fg-filter ${view === "grid" ? "is-on" : ""}`} onClick={() => setView("grid")}>Grid</button>
      </div>

      {view === "ranking" ? (
        <Block title={`Top ${Math.min(list.length, 25)}`}>
          {list.slice(0, 25).map((t) => {
            const roster = getPlayersByTeam(t.slug).slice(0, 2);
            const wins = t.form.filter((f) => f === "W").length;
            return (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="fg-row">
                <span className={`fg-rank ${t.rank <= 3 ? "top" : ""}`}>{t.rank}</span>
                <TeamLogo slug={t.slug} name={t.name} size={28} />
                <div className="fg-row-main">
                  <div className="fg-row-title">{t.name}</div>
                  <div className="fg-row-sub">
                    {t.region} · {roster.map((p) => p?.ign).filter(Boolean).join(", ")}
                  </div>
                </div>
                <FormDots form={t.form} />
                <span className="fg-row-stat">{wins}W</span>
                <span className="fg-row-sub">${(t.earnings / 1000).toFixed(0)}K</span>
              </Link>
            );
          })}
        </Block>
      ) : (
        <div className="fg-team-grid">
          {list.map((t) => {
            const topPlayer = getPlayersByTeam(t.slug).sort((a, b) => b.rating - a.rating)[0];
            return (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="fg-team-tile">
                <div className="fg-team-tile-head">
                  <span className={`fg-rank ${t.rank <= 3 ? "top" : ""}`}>{t.rank}</span>
                  <TeamLogo slug={t.slug} name={t.name} size={36} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>{t.tag} · {t.region}</div>
                  </div>
                </div>
                <FormDots form={t.form} />
                {topPlayer && (
                  <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                    MVP fantasy: {topPlayer.ign} · {getPickRate(topPlayer.slug)}% prop.
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-dim)" }}>
                  <span>${(t.earnings / 1000).toFixed(0)}K</span>
                  {topPlayer && <span>{getPlayerPrice(topPlayer.slug)}M</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
