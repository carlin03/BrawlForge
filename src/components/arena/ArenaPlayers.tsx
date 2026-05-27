"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArenaPanel, FormDots, PriceChange, ArenaBadge } from "./ArenaUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  getActivePlayers,
  getPlayerPrice,
  players,
  searchPlayers,
  teamName,
  transferMarket,
  getFantasyRole,
  getPickRate,
} from "@/lib/data";

type SortKey = "rating" | "fantasy" | "price" | "ownership";

export function ArenaPlayers() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("rating");

  const marketMap = useMemo(() => new Map(transferMarket.map((m) => [m.playerSlug, m])), []);

  const list = useMemo(() => {
    const base = query.trim() ? searchPlayers(query) : getActivePlayers();
    return [...base]
      .filter((p) => p.teamSlug)
      .sort((a, b) => {
        if (sortBy === "fantasy") return b.fantasyPoints - a.fantasyPoints;
        if (sortBy === "price") return getPlayerPrice(b.slug) - getPlayerPrice(a.slug);
        if (sortBy === "ownership") return b.fantasyOwnership - a.fantasyOwnership;
        return b.rating - a.rating;
      })
      .slice(0, 60);
  }, [query, sortBy]);

  return (
    <>
      <div className="ar-page-head">
        <h1 className="ar-h1">Jugadores</h1>
        <p className="ar-lead">{players.length} pros · {getActivePlayers().length} activos · datos fantasy y forma reciente.</p>
      </div>

      <div className="ar-filters">
        <input className="ar-input" placeholder="Buscar por IGN..." value={query} onChange={(e) => setQuery(e.target.value)} />
        {([
          ["rating", "Rating"],
          ["fantasy", "Fantasy pts"],
          ["price", "Precio"],
          ["ownership", "Propiedad"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" className={`ar-filter ${sortBy === key ? "is-on" : ""}`} onClick={() => setSortBy(key)}>
            {label}
          </button>
        ))}
        <Link href="/fantasy" className="ar-btn ar-btn-pick" style={{ padding: "9px 16px", fontSize: 12 }}>Alineación</Link>
      </div>

      <ArenaPanel title={`${list.length} resultados`}>
        <div className="ar-sort-bar">
          <span>Mostrando por {sortBy === "rating" ? "rating" : sortBy === "fantasy" ? "puntos fantasy" : sortBy === "price" ? "precio" : "propiedad"}</span>
        </div>
        {list.map((p, i) => {
          const mp = marketMap.get(p.slug);
          return (
            <Link key={p.slug} href={`/players/${p.slug}`} className="ar-compact-row">
              <span className="ar-compact-stat" style={{ width: 28, color: i < 3 ? "var(--ar-pick)" : "var(--ar-dim)", fontSize: 12 }}>{i + 1}</span>
              <TeamLogo slug={p.teamSlug!} name={teamName(p.teamSlug!)} size={28} />
              <div className="ar-compact-main">
                <div className="ar-compact-title" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {p.ign}
                  <span className="ar-player-role">{getFantasyRole(p.slug)}</span>
                  {mp?.trending === "hot" && <ArenaBadge variant="red">Hot</ArenaBadge>}
                </div>
                <div className="ar-compact-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {teamName(p.teamSlug!)} · {getPickRate(p.slug)}% prop.
                  {mp?.form && <FormDots form={mp.form} />}
                </div>
              </div>
              <span className="ar-compact-stat">{p.rating.toFixed(2)}</span>
              <span className="ar-compact-stat" style={{ color: "var(--ar-pick)" }}>{p.fantasyPoints}</span>
              <div style={{ textAlign: "right", minWidth: 44 }}>
                <span className="ar-compact-stat">{getPlayerPrice(p.slug)}M</span>
                {mp && <PriceChange change={mp.priceChange} />}
              </div>
            </Link>
          );
        })}
      </ArenaPanel>
    </>
  );
}
