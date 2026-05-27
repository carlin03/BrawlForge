"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TournamentCard } from "@/components/brawl/TournamentCard";
import type { EsportsTournament } from "@/lib/data/matches";

interface TournamentsBrowserProps {
  all: EsportsTournament[];
  counts: { live: number; upcoming: number; finished: number };
}

export function TournamentsBrowser({ all, counts }: TournamentsBrowserProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | EsportsTournament["status"]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = all;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.slug.includes(q),
      );
    } else if (status === "all") {
      list = list.filter((t) => t.featured || t.status !== "finished").slice(0, 80);
    } else {
      list = list.slice(0, 120);
    }
    return list;
  }, [all, query, status]);

  const live = filtered.filter((t) => t.status === "live");
  const upcoming = filtered.filter((t) => t.status === "upcoming");
  const finished = filtered.filter((t) => t.status === "finished");

  function EventList({ items, title, color }: { items: EsportsTournament[]; title: string; color?: string }) {
    if (!items.length) return null;
    return (
      <section className="bf-section">
        <div className="bf-section-head">
          <span className="bf-display" style={{ color: color ?? "inherit" }}>{title}</span>
          <span className="nv-dim">{items.length}</span>
        </div>
        <div className="nv-block">
          {items.map((t) => (
            <TournamentCard key={t.slug} tournament={t} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="nv-filters" style={{ marginBottom: 14 }}>
        <div className="fx-vault-search" style={{ flex: 1, minWidth: 200 }}>
          <Search className="h-4 w-4" style={{ color: "var(--nv-dim)" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${all.length} torneos…`}
            className="fx-vault-search-input"
          />
        </div>
        {(["all", "live", "upcoming", "finished"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`nv-chip ${status === s ? "is-on-blue" : ""}`}
          >
            {s === "all"
              ? `Todos (${all.length})`
              : s === "live"
                ? `Live (${counts.live})`
                : s === "upcoming"
                  ? `Próximos (${counts.upcoming})`
                  : `Fin (${counts.finished})`}
          </button>
        ))}
      </div>

      <EventList items={live} title="En vivo" color="var(--nv-red)" />
      <EventList items={upcoming} title="Próximos" color="var(--nv-blue)" />
      <EventList items={finished} title={query ? "Resultados" : "Recientes"} color="var(--nv-yellow)" />

      {filtered.length === 0 && (
        <p className="nv-dim" style={{ textAlign: "center", padding: "32px 0" }}>
          No hay torneos con ese filtro.
        </p>
      )}
    </>
  );
}
