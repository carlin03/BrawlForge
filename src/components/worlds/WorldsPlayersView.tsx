"use client";

import Link from "next/link";
import { getWorlds2026Players } from "@/lib/data/worlds-2026-field";

export function WorldsPlayersView() {
  const players = getWorlds2026Players();
  return (
    <div className="wc-app">
      <header className="wc-hero" style={{ padding: "1.25rem" }}>
        <h1 style={{ fontSize: "1.6rem", margin: 0 }}>Jugadores · World Finals 2026</h1>
        <p className="wc-lead" style={{ marginBottom: 0 }}>
          Plantillas del campo de Tokio ({players.length} jugadores).
        </p>
      </header>
      <div className="wc-panel">
        <div className="wc-player-grid">
          {players.map((p) => (
            <Link key={p.slug} href={`/players/${p.slug}`} className="wc-player-card">
              <strong>{p.ign}</strong>
              <span>
                {p.teamName} · {p.region}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
