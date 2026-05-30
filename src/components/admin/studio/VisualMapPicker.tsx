"use client";

import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { BS_MAP_CATALOG } from "@/lib/data/bs-catalog";

export function VisualMapPicker({
  label,
  pool,
  selected,
  onChange,
  variant = "pool",
}: {
  label: string;
  pool?: readonly { name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  variant?: "pool" | "ban";
}) {
  const items = pool ?? BS_MAP_CATALOG;

  function toggle(name: string) {
    if (selected.includes(name)) onChange(selected.filter((s) => s !== name));
    else onChange([...selected, name]);
  }

  return (
    <div className="bf-studio-visual-picker">
      <span className="bf-studio-visual-picker-label">{label}</span>
      <div className="bf-studio-visual-picker-grid">
        {items.map((m) => {
          const name = typeof m === "string" ? m : m.name;
          const on = selected.includes(name);
          return (
            <button
              key={name}
              type="button"
              className={`bf-studio-visual-picker-item ${on ? "is-on" : ""}`}
              onClick={() => toggle(name)}
            >
              <MapAssetCard name={name} variant={variant === "ban" && on ? "ban" : "pool"} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
