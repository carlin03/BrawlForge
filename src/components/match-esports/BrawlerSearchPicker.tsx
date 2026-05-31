"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import {
  isBrawlerBanned,
  MAX_BRAWLER_BANS_PER_TEAM,
  MAX_BRAWLER_PICKS_PER_MAP,
} from "@/lib/data/game-assets-catalog";
import type { BsBrawlerDef } from "@/lib/data/bs-catalog";

export function BrawlerSearchPicker({
  label,
  selected,
  onChange,
  banned = [],
  max = MAX_BRAWLER_PICKS_PER_MAP,
  variant = "pick",
  pool,
}: {
  label?: string;
  selected: string[];
  onChange: (next: string[]) => void;
  banned?: string[];
  max?: number;
  variant?: "pick" | "ban" | "default";
  /** Si se pasa, limita el catálogo a estos nombres (+ seleccionados). */
  pool?: string[];
}) {
  const { brawlers: catalog } = useGameAssetsCatalog();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let base: BsBrawlerDef[] = catalog;
    if (pool?.length) {
      const keys = new Set(pool.map((n) => n.toLowerCase()));
      for (const s of selected) keys.add(s.toLowerCase());
      base = catalog.filter((b) => keys.has(b.name.toLowerCase()) || keys.has(b.slug));
    }
    const needle = q.trim().toLowerCase();
    if (!needle) return base;
    return base.filter(
      (b) => b.name.toLowerCase().includes(needle) || b.slug.includes(needle),
    );
  }, [catalog, pool, q, selected]);

  function toggle(name: string) {
    if (variant !== "ban" && isBrawlerBanned(name, banned)) return;
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name));
      return;
    }
    const cap = variant === "ban" ? MAX_BRAWLER_BANS_PER_TEAM : max;
    if (selected.length >= cap) return;
    onChange([...selected, name]);
  }

  return (
    <div className="bf-brawler-search-picker">
      {label && <h4 className="bf-match-predict-subh">{label}</h4>}
      <div className="bf-brawler-search-bar">
        <Search size={18} aria-hidden />
        <input
          type="search"
          placeholder="Buscar brawler…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
      </div>
      {selected.length > 0 && (
        <div className="bf-brawler-pick-row is-selected-strip">
          {selected.map((name) => (
            <BrawlerAssetIcon
              key={name}
              name={name}
              variant={variant === "ban" ? "ban" : "pick"}
              size={64}
              selected
              onClick={() => toggle(name)}
            />
          ))}
        </div>
      )}
      <div className="bf-brawler-pick-row is-search-results">
        {list.map((b) => {
          const blocked = variant !== "ban" && isBrawlerBanned(b.name, banned);
          const full = !selected.includes(b.name) && selected.length >= (variant === "ban" ? MAX_BRAWLER_BANS_PER_TEAM : max);
          return (
            <BrawlerAssetIcon
              key={b.name}
              name={b.name}
              variant={blocked ? "ban" : variant === "ban" ? "ban" : "pick"}
              size={56}
              selected={selected.includes(b.name)}
              onClick={blocked || full ? undefined : () => toggle(b.name)}
            />
          );
        })}
      </div>
      {q && list.length === 0 && <p className="bf-match-predict-hint">Sin resultados para «{q}».</p>}
    </div>
  );
}
