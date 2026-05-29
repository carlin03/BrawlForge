"use client";

import Link from "next/link";
import { Search, Trophy, X } from "lucide-react";
import type { EsportsTournament } from "@/lib/data/matches";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { tierBadgeClass, tierLabel } from "@/lib/data";

function cleanName(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function MatchesTournamentsPanel({
  tournaments,
  selectedSlug,
  onSelect,
  query,
  onQueryChange,
}: {
  tournaments: EsportsTournament[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? tournaments.filter(
        (t) =>
          t.slug.includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q),
      )
    : tournaments;

  const selected = selectedSlug !== "all" ? tournaments.find((t) => t.slug === selectedSlug) : null;

  return (
    <div className="bf-matches-hub-aside-panel">
      <div className="bf-matches-hub-aside-head">
        <h2>
          <Trophy size={16} aria-hidden /> Torneos 2026
        </h2>
        <Link href="/tournaments">Ver todos</Link>
      </div>

      <label className="bf-teams-search bf-matches-tour-search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          placeholder="Buscar torneo por nombre…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            className="bf-matches-search-clear"
            onClick={() => onQueryChange("")}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        ) : null}
      </label>

      <button
        type="button"
        className={`bf-matches-hub-tour-pick ${selectedSlug === "all" ? "is-on" : ""}`}
        onClick={() => onSelect("all")}
      >
        <span className="bf-matches-hub-tour-pick-logo bf-matches-hub-tour-pick-all" aria-hidden>
          <Trophy size={22} />
        </span>
        <div className="bf-matches-hub-tour-pick-body">
          <strong>Todos los torneos</strong>
          <span>Sin filtrar partidos</span>
        </div>
      </button>

      {selected && (
        <div className="bf-matches-hub-tour-active">
          <TournamentLogo slug={selected.slug} name={cleanName(selected.shortName)} size={40} glow={false} />
          <div>
            <strong>{cleanName(selected.shortName)}</strong>
            <span>Filtro activo en partidos</span>
          </div>
          <button type="button" className="bf-matches-hub-tour-active-clear" onClick={() => onSelect("all")} aria-label="Quitar filtro">
            <X size={16} />
          </button>
        </div>
      )}

      <ul className="bf-matches-hub-tour-list">
        {filtered.length === 0 ? (
          <li className="bf-matches-hub-tour-empty">Ningún torneo coincide con la búsqueda.</li>
        ) : (
          filtered.map((t) => {
            const on = selectedSlug === t.slug;
            return (
              <li key={t.slug}>
                <div className={`bf-matches-hub-tour-row ${on ? "is-on" : ""}`}>
                  <button
                    type="button"
                    className="bf-matches-hub-tour-pick"
                    onClick={() => onSelect(t.slug)}
                    aria-pressed={on}
                  >
                    <TournamentLogo slug={t.slug} name={cleanName(t.shortName)} size={48} glow={false} />
                    <div className="bf-matches-hub-tour-pick-body">
                      <strong>{cleanName(t.shortName)}</strong>
                      <span>{t.prizePool}</span>
                    </div>
                    {t.tier != null && (
                      <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                    )}
                  </button>
                  <Link href={`/tournaments/${t.slug}`} className="bf-matches-hub-tour-detail" title="Ver torneo">
                    →
                  </Link>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
