"use client";

import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { BS_BRAWLER_CATALOG } from "@/lib/data/bs-catalog";

export function VisualBrawlerPicker({
  label,
  selected,
  onChange,
  variant = "default",
}: {
  label: string;
  selected: string[];
  onChange: (next: string[]) => void;
  variant?: "default" | "ban";
}) {
  function toggle(name: string) {
    if (selected.includes(name)) onChange(selected.filter((s) => s !== name));
    else onChange([...selected, name]);
  }

  return (
    <div className="bf-studio-visual-picker">
      <span className="bf-studio-visual-picker-label">{label}</span>
      <div className="bf-studio-visual-brawler-row">
        {BS_BRAWLER_CATALOG.map((b) => (
          <BrawlerAssetIcon
            key={b.name}
            name={b.name}
            variant={variant === "ban" ? "ban" : "default"}
            size={56}
            selected={selected.includes(b.name)}
            onClick={() => toggle(b.name)}
          />
        ))}
      </div>
    </div>
  );
}
