"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { getWorlds2026Players } from "@/lib/data/worlds-2026-field";

export function WorldsPlayersView() {
  const players = useMemo(() => getWorlds2026Players(), []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.ign.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.slug.includes(q),
    );
  }, [players, query]);

  return (
    <div className="wc-app">
      <header className="wc-hero" style={{ padding: "1.25rem" }}>
        <h1 style={{ fontSize: "1.7rem", margin: 0 }}>Cartas · Jugadores WF 2026</h1>
        <p className="wc-lead" style={{ marginBottom: "0.75rem" }}>
          {players.length} pros del Mundial en Tokio — cartas premium con foto, club y rating.
        </p>
        <label className="wc-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="Buscar IGN o equipo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </header>
      <div className="wc-panel">
        <div className="wc-cards-grid">
          {filtered.map((p) => (
            <div key={p.slug} className="wc-card-slot">
              <PlayerCard
                playerSlug={p.slug}
                clubSlug={p.teamSlug}
                size="md"
                href={`/players/${p.slug}`}
                showExtended
              />
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="wc-hint">Sin resultados.</p>}
      </div>
    </div>
  );
}
