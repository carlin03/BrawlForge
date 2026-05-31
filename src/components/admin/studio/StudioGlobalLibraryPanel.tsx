"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Download, Map, Users } from "lucide-react";
import { StudioPanel, StudioToast } from "./studio-ui";
import { invalidateGameAssetsCache } from "@/hooks/useGameAssetsCatalog";
import type { CustomBrawlerEntry, CustomMapEntry, GameAssetsCatalog } from "@/lib/data/game-assets-catalog";
import { StudioLibraryMapEditor } from "./StudioLibraryMapEditor";
import { StudioLibraryBrawlerEditor } from "./StudioLibraryBrawlerEditor";

type Tab = "maps" | "brawlers";

export function StudioGlobalLibraryPanel() {
  const [catalog, setCatalog] = useState<GameAssetsCatalog>({ brawlers: [], maps: [] });
  const [tab, setTab] = useState<Tab>("maps");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [q, setQ] = useState("");

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

  async function save(next?: GameAssetsCatalog) {
    const payload = next ?? catalog;
    setMsg("Guardando…");
    setError(false);
    const res = await fetch("/api/cms/admin/assets-catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog: payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(true);
      setMsg(data.error || "Error al guardar");
      return;
    }
    invalidateGameAssetsCache();
    setCatalog(data.catalog);
    setMsg("Biblioteca guardada");
  }

  async function importBrawlify() {
    setImporting(true);
    setMsg("Importando desde BrawlAPI (Brawlify)…");
    setError(false);
    const res = await fetch("/api/cms/admin/assets-catalog/import-brawlify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brawlers: true, maps: true }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) {
      setError(true);
      setMsg(data.error || "Error al importar");
      return;
    }
    invalidateGameAssetsCache();
    setCatalog(data.catalog);
    setMsg(
      `Importado: ${data.stats?.brawlers ?? 0} brawlers, ${data.stats?.maps ?? 0} mapas (+${data.stats?.brawlersAdded ?? 0} / +${data.stats?.mapsAdded ?? 0} nuevos)`,
    );
  }

  const filteredMaps = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return catalog.maps;
    return catalog.maps.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.mode?.toLowerCase().includes(needle),
    );
  }, [catalog.maps, q]);

  const filteredBrawlers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return catalog.brawlers;
    return catalog.brawlers.filter(
      (b) =>
        b.name.toLowerCase().includes(needle) ||
        b.rarity?.toLowerCase().includes(needle) ||
        b.class?.toLowerCase().includes(needle),
    );
  }, [catalog.brawlers, q]);

  function updateMap(i: number, patch: Partial<CustomMapEntry>) {
    const maps = [...catalog.maps];
    const idx = catalog.maps.indexOf(filteredMaps[i]);
    if (idx < 0) return;
    maps[idx] = { ...maps[idx], ...patch };
    setCatalog({ ...catalog, maps });
  }

  function updateBrawler(i: number, patch: Partial<CustomBrawlerEntry>) {
    const brawlers = [...catalog.brawlers];
    const idx = catalog.brawlers.indexOf(filteredBrawlers[i]);
    if (idx < 0) return;
    brawlers[idx] = { ...brawlers[idx], ...patch };
    setCatalog({ ...catalog, brawlers });
  }

  return (
    <div className="bf-studio-global-library">
      <StudioPanel
        title="Biblioteca global"
        lead="Configura mapas y brawlers una vez. En cada partido solo eliges nombres (plantilla u orden); imagen, modo y datos estratégicos se cargan solos. Fuente oficial: BrawlAPI / Brawlify CDN."
      >
        <div className="bf-studio-library-actions">
          <button
            type="button"
            className="bp-btn bp-btn-gold"
            disabled={importing}
            onClick={() => void importBrawlify()}
          >
            <Download size={16} /> {importing ? "Importando…" : "Importar Brawlify (BrawlAPI)"}
          </button>
          <button type="button" className="bp-btn bp-btn-ghost" onClick={() => void save()}>
            Guardar biblioteca
          </button>
          {catalog.brawlapi_synced_at && (
            <span className="bf-studio-muted">
              Última sync: {new Date(catalog.brawlapi_synced_at).toLocaleString("es-ES")}
            </span>
          )}
        </div>

        <nav className="bf-studio-library-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "maps"}
            className={`bf-studio-competition-tab ${tab === "maps" ? "is-on" : ""}`}
            onClick={() => setTab("maps")}
          >
            <Map size={16} /> Mapas ({catalog.maps.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "brawlers"}
            className={`bf-studio-competition-tab ${tab === "brawlers" ? "is-on" : ""}`}
            onClick={() => setTab("brawlers")}
          >
            <Users size={16} /> Brawlers ({catalog.brawlers.length})
          </button>
        </nav>

        <input
          type="search"
          className="bf-studio-library-search"
          placeholder="Buscar en biblioteca…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </StudioPanel>

      {loading ? (
        <p className="bf-studio-muted">Cargando biblioteca…</p>
      ) : tab === "maps" ? (
        <StudioLibraryMapEditor
          maps={filteredMaps}
          onUpdate={updateMap}
          onAdd={() =>
            setCatalog({
              ...catalog,
              maps: [...catalog.maps, { name: "", mode: "", enabled: true }],
            })
          }
          onRemove={(i) => {
            const name = filteredMaps[i]?.name;
            setCatalog({
              ...catalog,
              maps: catalog.maps.filter((m) => m.name !== name),
            });
          }}
        />
      ) : (
        <StudioLibraryBrawlerEditor
          brawlers={filteredBrawlers}
          onUpdate={updateBrawler}
          onAdd={() =>
            setCatalog({
              ...catalog,
              brawlers: [...catalog.brawlers, { name: "", enabled: true }],
            })
          }
          onRemove={(i) => {
            const name = filteredBrawlers[i]?.name;
            setCatalog({
              ...catalog,
              brawlers: catalog.brawlers.filter((b) => b.name !== name),
            });
          }}
        />
      )}

      <StudioToast message={msg} error={error} />
    </div>
  );
}
