"use client";

import { useCallback, useEffect, useState } from "react";
import { StudioField, StudioInput, StudioToast } from "@/components/admin/studio/studio-ui";
import { invalidateGameAssetsCache } from "@/hooks/useGameAssetsCatalog";
import type { CustomBrawlerEntry, CustomMapEntry, GameAssetsCatalog } from "@/lib/data/game-assets-catalog";

export function StudioAssetsCatalogEditor() {
  const [catalog, setCatalog] = useState<GameAssetsCatalog>({ brawlers: [], maps: [] });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/cms/admin/assets-catalog")
      .then((r) => r.json())
      .then((data) => {
        if (data.catalog) setCatalog(data.catalog);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setMsg("Guardando…");
    setError(false);
    const res = await fetch("/api/cms/admin/assets-catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(true);
      setMsg(data.error || "Error al guardar");
      return;
    }
    invalidateGameAssetsCache();
    setCatalog(data.catalog);
    setMsg("Catálogo guardado");
  }

  function updateBrawler(i: number, patch: Partial<CustomBrawlerEntry>) {
    const brawlers = [...catalog.brawlers];
    brawlers[i] = { ...brawlers[i], ...patch };
    setCatalog({ ...catalog, brawlers });
  }

  function addBrawler() {
    setCatalog({
      ...catalog,
      brawlers: [...catalog.brawlers, { name: "", imageUrl: "", enabled: true }],
    });
  }

  function removeBrawler(i: number) {
    setCatalog({ ...catalog, brawlers: catalog.brawlers.filter((_, j) => j !== i) });
  }

  function updateMap(i: number, patch: Partial<CustomMapEntry>) {
    const maps = [...catalog.maps];
    maps[i] = { ...maps[i], ...patch };
    setCatalog({ ...catalog, maps });
  }

  function addMap() {
    setCatalog({
      ...catalog,
      maps: [...catalog.maps, { name: "", mode: "", imageUrl: "", enabled: true }],
    });
  }

  function removeMap(i: number) {
    setCatalog({ ...catalog, maps: catalog.maps.filter((_, j) => j !== i) });
  }

  if (loading) return <p className="bf-studio-muted">Cargando catálogo…</p>;

  return (
    <div className="bf-studio-assets-catalog">
      <p className="bf-studio-hint">
        Entradas manuales se fusionan con el catálogo base. Desactiva o añade brawlers/mapas sin tocar código.
      </p>

      <h3 className="bf-studio-subh">Brawlers personalizados</h3>
      {catalog.brawlers.map((b, i) => (
        <div key={i} className="bf-studio-asset-row">
          <StudioField label="Nombre">
            <StudioInput value={b.name} onChange={(e) => updateBrawler(i, { name: e.target.value })} />
          </StudioField>
          <StudioField label="URL imagen">
            <StudioInput
              value={b.imageUrl ?? ""}
              onChange={(e) => updateBrawler(i, { imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </StudioField>
          <label className="bf-studio-check">
            <input
              type="checkbox"
              checked={b.enabled !== false}
              onChange={(e) => updateBrawler(i, { enabled: e.target.checked })}
            />
            Activo
          </label>
          <button type="button" className="bp-btn bp-btn-ghost" onClick={() => removeBrawler(i)}>
            Quitar
          </button>
        </div>
      ))}
      <button type="button" className="bp-btn bp-btn-ghost" onClick={addBrawler}>
        + Brawler
      </button>

      <h3 className="bf-studio-subh">Mapas personalizados</h3>
      {catalog.maps.map((m, i) => (
        <div key={i} className="bf-studio-asset-row">
          <StudioField label="Nombre">
            <StudioInput value={m.name} onChange={(e) => updateMap(i, { name: e.target.value })} />
          </StudioField>
          <StudioField label="Modo">
            <StudioInput value={m.mode ?? ""} onChange={(e) => updateMap(i, { mode: e.target.value })} />
          </StudioField>
          <StudioField label="URL imagen">
            <StudioInput
              value={m.imageUrl ?? ""}
              onChange={(e) => updateMap(i, { imageUrl: e.target.value })}
            />
          </StudioField>
          <label className="bf-studio-check">
            <input
              type="checkbox"
              checked={m.enabled !== false}
              onChange={(e) => updateMap(i, { enabled: e.target.checked })}
            />
            Activo
          </label>
          <button type="button" className="bp-btn bp-btn-ghost" onClick={() => removeMap(i)}>
            Quitar
          </button>
        </div>
      ))}
      <button type="button" className="bp-btn bp-btn-ghost" onClick={addMap}>
        + Mapa
      </button>

      <div className="bf-studio-actions-row">
        <button type="button" className="bp-btn bp-btn-gold" onClick={() => void save()}>
          Guardar catálogo global
        </button>
      </div>
      <StudioToast message={msg} error={error} />
    </div>
  );
}
