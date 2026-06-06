"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CmsRuntimeProvider } from "@/contexts/CmsRuntimeContext";
import { DEFAULT_CMS_RUNTIME } from "@/lib/cms/runtime-defaults";
import type { CmsRuntimePayload } from "@/lib/cms/runtime-types";
import { mergeMatchPools } from "@/lib/data/merge-match-pools";
import { getLegacyMatchList } from "@/lib/data/matches";

export function CmsRuntimeBootstrap({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<CmsRuntimePayload>(DEFAULT_CMS_RUNTIME);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const res = await fetch("/api/cms/runtime", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = (await res.json()) as CmsRuntimePayload;
          if (data?.config) setRuntime(data);
        }
      } catch {
        /* DEFAULT_CMS_RUNTIME */
      } finally {
        if (!cancelled) window.dispatchEvent(new Event("bf-cms-runtime-ready"));
      }

      const loadMatches = async () => {
        try {
          const res = await fetch("/api/cms/runtime/matches", { cache: "no-store" });
          if (cancelled || !res.ok) return;
          const data = (await res.json()) as { matchPool?: CmsRuntimePayload["matchPool"] };
          if (!data?.matchPool?.length) return;
          const merged = mergeMatchPools(data.matchPool, getLegacyMatchList());
          setRuntime((prev) => ({
            ...prev,
            matchPool: merged,
            matchSource: "hybrid",
          }));
          window.dispatchEvent(new Event("bf-match-pool-updated"));
        } catch {
          /* legacy local en cliente */
        }
      };

      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(() => void loadMatches(), { timeout: 8000 });
      } else {
        window.setTimeout(() => void loadMatches(), 6000);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return <CmsRuntimeProvider value={runtime}>{children}</CmsRuntimeProvider>;
}
