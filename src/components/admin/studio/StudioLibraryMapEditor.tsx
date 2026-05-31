"use client";

import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { StudioField, StudioInput } from "./studio-ui";
import type { CustomMapEntry } from "@/lib/data/game-assets-catalog";

function csvToList(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToCsv(list?: string[]): string {
  return (list ?? []).join(", ");
}

export function StudioLibraryMapEditor({
  maps,
  onUpdate,
  onAdd,
  onRemove,
}: {
  maps: CustomMapEntry[];
  onUpdate: (i: number, patch: Partial<CustomMapEntry>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="bf-studio-library-list">
      {maps.map((m, i) => (
        <details key={`${m.name}-${i}`} className="bf-studio-library-card" open={i < 2}>
          <summary className="bf-studio-library-card-head">
            <MapAssetCard name={m.name || "Nuevo mapa"} variant="pool" size="md" />
            <span>
              <strong>{m.name || "Sin nombre"}</strong>
              {m.mode && <em>{m.mode}</em>}
            </span>
          </summary>
          <div className="bf-studio-library-card-body">
            <StudioField label="Nombre">
              <StudioInput value={m.name} onChange={(e) => onUpdate(i, { name: e.target.value })} />
            </StudioField>
            <StudioField label="Modo">
              <StudioInput value={m.mode ?? ""} onChange={(e) => onUpdate(i, { mode: e.target.value })} />
            </StudioField>
            <StudioField label="URL imagen">
              <StudioInput
                value={m.imageUrl ?? ""}
                onChange={(e) => onUpdate(i, { imageUrl: e.target.value })}
              />
            </StudioField>
            <StudioField label="Descripción">
              <StudioInput
                value={m.description ?? ""}
                onChange={(e) => onUpdate(i, { description: e.target.value })}
              />
            </StudioField>
            <StudioField label="Mejores picks">
              <StudioInput
                value={listToCsv(m.best_picks)}
                onChange={(e) => onUpdate(i, { best_picks: csvToList(e.target.value) })}
              />
            </StudioField>
            <StudioField label="Más usados">
              <StudioInput
                value={listToCsv(m.most_used)}
                onChange={(e) => onUpdate(i, { most_used: csvToList(e.target.value) })}
              />
            </StudioField>
            <StudioField label="Más baneados">
              <StudioInput
                value={listToCsv(m.most_banned)}
                onChange={(e) => onUpdate(i, { most_banned: csvToList(e.target.value) })}
              />
            </StudioField>
            <StudioField label="Win rates (Brawler:62%)">
              <StudioInput
                value={(m.win_rates ?? []).map((w) => `${w.brawler}:${w.rate}`).join(", ")}
                onChange={(e) => {
                  const win_rates = e.target.value
                    .split(/[,;]+/)
                    .map((pair) => {
                      const [brawler, rate] = pair.split(":").map((s) => s.trim());
                      return brawler && rate ? { brawler, rate } : null;
                    })
                    .filter((x): x is { brawler: string; rate: string } => x != null);
                  onUpdate(i, { win_rates });
                }}
              />
            </StudioField>
            <StudioField label="Estadísticas / datos extra">
              <StudioInput
                value={m.stats_extra ?? ""}
                onChange={(e) => onUpdate(i, { stats_extra: e.target.value })}
              />
            </StudioField>
            <StudioField label="Notas estratégicas">
              <StudioInput value={m.notes ?? ""} onChange={(e) => onUpdate(i, { notes: e.target.value })} />
            </StudioField>
            <label className="bf-studio-check">
              <input
                type="checkbox"
                checked={m.enabled !== false}
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
        + Mapa manual
      </button>
    </div>
  );
}
