"use client";

import { useEffect, useState } from "react";
import type { EsportsMatch } from "@/lib/data/esports-match-types";

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
        const res = await fetch("/api/home/matches", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
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

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
