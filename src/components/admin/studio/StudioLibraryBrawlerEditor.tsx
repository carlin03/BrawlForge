"use client";

import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { StudioField, StudioInput } from "./studio-ui";
import type { CustomBrawlerEntry } from "@/lib/data/game-assets-catalog";

export function StudioLibraryBrawlerEditor({
  brawlers,
  onUpdate,
  onAdd,
  onRemove,
}: {
  brawlers: CustomBrawlerEntry[];
  onUpdate: (i: number, patch: Partial<CustomBrawlerEntry>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="bf-studio-library-list">
      {brawlers.map((b, i) => (
        <details key={`${b.name}-${i}`} className="bf-studio-library-card" open={i < 2}>
          <summary className="bf-studio-library-card-head">
            <BrawlerAssetIcon name={b.name || "Shelly"} size={56} hideName />
            <span>
              <strong>{b.name || "Sin nombre"}</strong>
              {(b.rarity || b.class) && (
                <em>
                  {[b.rarity, b.class].filter(Boolean).join(" · ")}
                </em>
              )}
            </span>
          </summary>
          <div className="bf-studio-library-card-body">
            <StudioField label="Nombre">
              <StudioInput value={b.name} onChange={(e) => onUpdate(i, { name: e.target.value })} />
            </StudioField>
            <StudioField label="URL imagen (retrato)">
              <StudioInput
                value={b.imageUrl ?? ""}
                onChange={(e) => onUpdate(i, { imageUrl: e.target.value })}
                placeholder="https://cdn.brawlify.com/profile/…"
              />
            </StudioField>
            <StudioField label="Rareza">
              <StudioInput value={b.rarity ?? ""} onChange={(e) => onUpdate(i, { rarity: e.target.value })} />
            </StudioField>
            <StudioField label="Clase">
              <StudioInput value={b.class ?? ""} onChange={(e) => onUpdate(i, { class: e.target.value })} />
            </StudioField>
            <StudioField label="Descripción">
              <StudioInput
                value={b.description ?? ""}
                onChange={(e) => onUpdate(i, { description: e.target.value })}
              />
            </StudioField>
            <StudioField label="Notas">
              <StudioInput value={b.notes ?? ""} onChange={(e) => onUpdate(i, { notes: e.target.value })} />
            </StudioField>
            <label className="bf-studio-check">
              <input
                type="checkbox"
                checked={b.enabled !== false}
                onChange={(e) => onUpdate(i, { enabled: e.target.checked })}
              />
              Activo en biblioteca
            </label>
            <button type="button" className="bp-btn bp-btn-ghost" onClick={() => onRemove(i)}>
              Eliminar de biblioteca
            </button>
          </div>
        </details>
      ))}
      <button type="button" className="bp-btn bp-btn-ghost" onClick={onAdd}>
        + Brawler manual
      </button>
    </div>
  );
}
