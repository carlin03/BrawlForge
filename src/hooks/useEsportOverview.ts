"use client";

import { useEffect, useState } from "react";
import type { EsportOverview } from "@/lib/data/esport-analytics";

export function useEsportOverview() {
  const [overview, setOverview] = useState<EsportOverview | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/esport/overview");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data.ok && data.overview) setOverview(data.overview);
      } catch {
        /* fallback en vista */
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { overview, ready };
}
