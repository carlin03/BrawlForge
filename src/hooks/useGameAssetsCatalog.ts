"use client";

import { useEffect, useState } from "react";
import {
  mergeBrawlerCatalog,
  mergeMapCatalog,
  type GameAssetsCatalog,
} from "@/lib/data/game-assets-catalog";
import type { BsBrawlerDef, BsMapDef } from "@/lib/data/bs-catalog";

let cache: { brawlers: BsBrawlerDef[]; maps: BsMapDef[] } | null = null;
let inflight: Promise<void> | null = null;

async function loadCatalog(): Promise<{ brawlers: BsBrawlerDef[]; maps: BsMapDef[] }> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/game-assets")
      .then((r) => (r.ok ? r.json() : { catalog: null }))
      .then((data) => {
        const custom = (data.catalog ?? null) as GameAssetsCatalog | null;
        cache = {
          brawlers: mergeBrawlerCatalog(custom),
          maps: mergeMapCatalog(custom),
        };
      })
      .catch(() => {
        cache = { brawlers: mergeBrawlerCatalog(null), maps: mergeMapCatalog(null) };
      })
      .finally(() => {
        inflight = null;
      });
  }
  await inflight;
  return cache!;
}

export function useGameAssetsCatalog() {
  const [brawlers, setBrawlers] = useState<BsBrawlerDef[]>(() => cache?.brawlers ?? mergeBrawlerCatalog(null));
  const [maps, setMaps] = useState<BsMapDef[]>(() => cache?.maps ?? mergeMapCatalog(null));
  const [ready, setReady] = useState(!!cache);

  useEffect(() => {
    let cancelled = false;
    void loadCatalog().then((c) => {
      if (cancelled) return;
      setBrawlers(c.brawlers);
      setMaps(c.maps);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { brawlers, maps, ready };
}

export function invalidateGameAssetsCache() {
  cache = null;
}
