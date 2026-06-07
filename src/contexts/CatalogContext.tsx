"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CatalogMarketRow,
  CatalogPlayerRow,
  CatalogSnapshot,
  CatalogTeamRow,
  CatalogTournamentRow,
} from "@/lib/supabase/catalog-types";
import { isTierBPlus } from "@/lib/data/catalog";
import { buildMarketMap } from "@/lib/catalog-merge";
import { isHiddenTeam } from "@/lib/data/blocked-team-slugs";
import { syncCatalogTeamsCache } from "@/lib/data/circuit-roster";
import { getPrefetched, prefetchJson } from "@/lib/prefetch-cache";

type CatalogState = {
  ready: boolean;
  fromDb: boolean;
  syncedAt: string | null;
  teamCount: number;
  playerCount: number;
  tournamentCount: number;
  teamsBySlug: Map<string, CatalogTeamRow>;
  playersBySlug: Map<string, CatalogPlayerRow>;
  tournamentsBySlug: Map<string, CatalogTournamentRow>;
  marketByKey: Map<string, CatalogMarketRow>;
};

const CatalogContext = createContext<CatalogState>({
  ready: false,
  fromDb: false,
  syncedAt: null,
  teamCount: 0,
  playerCount: 0,
  tournamentCount: 0,
  teamsBySlug: new Map(),
  playersBySlug: new Map(),
  tournamentsBySlug: new Map(),
  marketByKey: new Map(),
});

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [ready, setReady] = useState(true);

  const load = useCallback(async () => {
    try {
      const data =
        getPrefetched<CatalogSnapshot & { ok?: boolean }>("/api/catalog") ??
        ((await prefetchJson("/api/catalog")) as CatalogSnapshot & { ok?: boolean });
      if (data?.ok && data.teams?.length) {
        setSnapshot({
          teams: data.teams,
          players: data.players,
          tournaments: data.tournaments,
          market: data.market,
          syncedAt: data.syncedAt,
        });
      }
    } catch {
      /* JSON local sigue como fallback */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const onResume = () => void load();
    window.addEventListener("bf-resume-background-load", onResume);
    return () => window.removeEventListener("bf-resume-background-load", onResume);
  }, [load]);

  useEffect(() => {
    const onCatalogUpdated = () => {
      void load();
    };
    window.addEventListener("bf-catalog-updated", onCatalogUpdated);
    return () => window.removeEventListener("bf-catalog-updated", onCatalogUpdated);
  }, [load]);

  const value = useMemo<CatalogState>(() => {
    const teamsBySlug = new Map<string, CatalogTeamRow>();
    const playersBySlug = new Map<string, CatalogPlayerRow>();
    const tournamentsBySlug = new Map<string, CatalogTournamentRow>();
    if (snapshot) {
      syncCatalogTeamsCache(snapshot.teams);
      for (const t of snapshot.teams) {
        if (isHiddenTeam(t)) continue;
        teamsBySlug.set(t.slug, t);
      }
      for (const p of snapshot.players) playersBySlug.set(p.slug, p);
      for (const tour of snapshot.tournaments ?? []) {
        if (!isTierBPlus({ tier: tour.tier ?? undefined })) continue;
        tournamentsBySlug.set(tour.slug, tour);
      }
    } else {
      syncCatalogTeamsCache([]);
    }
    const marketByKey = snapshot?.market?.length ? buildMarketMap(snapshot.market) : new Map();
    return {
      ready,
      fromDb: !!snapshot?.teams.length,
      syncedAt: snapshot?.syncedAt ?? null,
      teamCount: teamsBySlug.size,
      playerCount: playersBySlug.size,
      tournamentCount: tournamentsBySlug.size,
      teamsBySlug,
      playersBySlug,
      tournamentsBySlug,
      marketByKey,
    };
  }, [snapshot, ready]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}

export function useCatalogTeam(slug: string): CatalogTeamRow | undefined {
  const { teamsBySlug } = useCatalog();
  return teamsBySlug.get(slug);
}

export function useCatalogPlayer(slug: string): CatalogPlayerRow | undefined {
  const { playersBySlug } = useCatalog();
  return playersBySlug.get(slug);
}

export function useCatalogMarket(tournament: string, playerSlug: string): CatalogMarketRow | undefined {
  const { marketByKey } = useCatalog();
  return marketByKey.get(`${tournament}:${playerSlug}`);
}

/** Tras guardar jugador/equipo en admin — refresca useResolvedPlayer/Team en toda la app */
export function notifyCatalogUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bf-catalog-updated"));
  }
}
