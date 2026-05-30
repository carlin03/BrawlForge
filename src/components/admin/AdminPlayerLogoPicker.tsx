"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";

export type AdminPlayerPickerOption = {
  slug: string;
  ign: string;
  team_slug?: string | null;
};

export function AdminPlayerLogoPicker({
  players,
  selected,
  onChange,
  teamSlug,
  searchPlaceholder = "Buscar jugador…",
  maxHeight = "320px",
}: {
  players: AdminPlayerPickerOption[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  teamSlug?: string;
  searchPlaceholder?: string;
  maxHeight?: string;
}) {
  const [search, setSearch] = useState("");

  const pool = useMemo(() => {
    let list = players.filter((p) => !p.team_slug || !teamSlug || p.team_slug === teamSlug);
    list = [...list].sort((a, b) => a.ign.localeCompare(b.ign));
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) => p.slug.toLowerCase().includes(q) || p.ign.toLowerCase().includes(q),
    );
  }, [players, teamSlug, search]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(slug: string) {
    if (selectedSet.has(slug)) onChange(selected.filter((s) => s !== slug));
    else onChange([...selected, slug]);
  }

  return (
    <div className="bf-admin-team-logo-picker">
      <div className="bf-admin-search-wrap" style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--bp-dim)" }} />
        <input
          className="bf-admin-search"
          style={{ paddingLeft: 40 }}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="bf-admin-logos-grid bf-admin-team-picker-grid" style={{ maxHeight }}>
        {pool.map((p) => {
          const on = selectedSet.has(p.slug);
          return (
            <button
              key={p.slug}
              type="button"
              className={`bf-admin-logo-tile ${on ? "is-on" : ""}`}
              onClick={() => toggle(p.slug)}
              title={p.ign}
            >
              {on && (
                <span className="bf-admin-logo-tile-check" aria-hidden>
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
              <PlayerPhoto
                playerSlug={p.slug}
                teamSlug={p.team_slug ?? teamSlug}
                photoUrlOverride=""
                skipCatalogPhoto
                size={48}
              />
              <span className="bf-admin-logo-tile-name">{p.ign}</span>
              {p.team_slug && p.team_slug !== teamSlug && (
                <span className="bf-admin-logo-tile-sub">{p.team_slug}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="bf-admin-field-hint" style={{ marginTop: 8 }}>
        {selected.length} jugador{selected.length === 1 ? "" : "es"} en plantilla
      </p>
    </div>
  );
}
