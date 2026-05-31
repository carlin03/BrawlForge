"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import { resolveMapCatalogEntry } from "@/lib/data/game-assets-catalog";

export function MapOrderFromLibrary({
  mapOrder,
  mapPool,
  onChangeOrder,
  onChangePool,
}: {
  mapOrder: string[];
  mapPool: string[];
  onChangeOrder: (order: string[]) => void;
  onChangePool: (pool: string[]) => void;
}) {
  const { maps, ready } = useGameAssetsCatalog();
  const libraryNames = useMemo(() => maps.map((m) => m.name), [maps]);

  function togglePool(name: string) {
    if (mapPool.includes(name)) {
      const nextPool = mapPool.filter((n) => n !== name);
      onChangePool(nextPool);
      onChangeOrder(mapOrder.filter((n) => n !== name));
    } else {
      onChangePool([...mapPool, name]);
    }
  }

  function toggleOrder(name: string) {
    if (mapOrder.includes(name)) {
      onChangeOrder(mapOrder.filter((n) => n !== name));
    } else {
      onChangeOrder([...mapOrder, name]);
    }
  }

  function moveUp(i: number) {
    if (i <= 0) return;
    const next = [...mapOrder];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChangeOrder(next);
  }

  if (!ready) return <p className="bf-studio-muted">Cargando biblioteca…</p>;

  return (
    <div className="bf-studio-map-order-library">
      <p className="bf-studio-hint">
        Elige mapas por <strong>nombre</strong>. Modo, imagen y datos estratégicos vienen de{" "}
        <Link href="/admin?module=biblioteca">Biblioteca global</Link>. No hace falta rellenarlos aquí.
      </p>

      <h4 className="bf-studio-subh">Pool del partido</h4>
      <div className="bf-studio-library-pick-grid">
        {libraryNames.map((name) => {
          const def = resolveMapCatalogEntry(name, maps);
          const on = mapPool.includes(name);
          return (
            <button
              key={name}
              type="button"
              className={`bf-studio-library-pick ${on ? "is-on" : ""}`}
              onClick={() => togglePool(name)}
            >
              <MapAssetCard name={name} variant="pool" />
              <span>{def.mode}</span>
            </button>
          );
        })}
      </div>

      {mapPool.length > 0 && (
        <>
          <h4 className="bf-studio-subh">Orden de la serie (clic para incluir / excluir)</h4>
          <div className="bf-studio-map-order-strip-admin">
            {mapPool.map((name) => {
              const inOrder = mapOrder.includes(name);
              const idx = mapOrder.indexOf(name);
              return (
                <button
                  key={name}
                  type="button"
                  className={`bf-studio-library-pick is-order ${inOrder ? "is-on" : ""}`}
                  onClick={() => toggleOrder(name)}
                >
                  <MapAssetCard
                    name={name}
                    variant="order"
                    index={inOrder ? idx : undefined}
                    isDecisive={false}
                  />
                </button>
              );
            })}
          </div>

          {mapOrder.length > 0 && (
            <div className="bf-studio-map-order-confirm">
              <span>Orden actual:</span>
              {mapOrder.map((name, i) => (
                <span key={name} className="bf-studio-order-chip">
                  {i + 1}. {name}
                  <button type="button" onClick={() => moveUp(i)} disabled={i === 0}>
                    ↑
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
