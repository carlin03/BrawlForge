"use client";

import { useEffect, useState } from "react";
import type { EsportsMatch } from "@/lib/data/esports-match-types";
import { getPrefetched, prefetchJson } from "@/lib/prefetch-cache";

type HomeMatchesState = {
  ready: boolean;
  live: EsportsMatch[];
  upcoming: EsportsMatch[];
  results: EsportsMatch[];
  liveCount: number;
};

const EMPTY: HomeMatchesState = {
  ready: false,
  live: [],
  upcoming: [],
  results: [],
  liveCount: 0,
};

export function useHomeMatches(): HomeMatchesState {
  const [state, setState] = useState<HomeMatchesState>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = (await prefetchJson("/api/home/matches")) as {
          live?: EsportsMatch[];
          upcoming?: EsportsMatch[];
          results?: EsportsMatch[];
          liveCount?: number;
        } | null;
        if (cancelled || !data) return;
        setState({
          ready: true,
          live: data.live ?? [],
          upcoming: data.upcoming ?? [],
          results: data.results ?? [],
          liveCount: data.liveCount ?? data.live?.length ?? 0,
        });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, ready: true }));
      }
    }

    const cached = getPrefetched<{
      live?: EsportsMatch[];
      upcoming?: EsportsMatch[];
      results?: EsportsMatch[];
      liveCount?: number;
    }>("/api/home/matches");
    if (cached) {
      setState({
        ready: true,
        live: cached.live ?? [],
        upcoming: cached.upcoming ?? [],
        results: cached.results ?? [],
        liveCount: cached.liveCount ?? cached.live?.length ?? 0,
      });
    }
    void load();
    const onResume = () => void load();
    window.addEventListener("bf-resume-background-load", onResume);
    return () => {
      cancelled = true;
      window.removeEventListener("bf-resume-background-load", onResume);
    };
  }, []);

  return state;
}
