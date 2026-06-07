"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CmsRuntimeProvider } from "@/contexts/CmsRuntimeContext";
import { DEFAULT_CMS_RUNTIME } from "@/lib/cms/runtime-defaults";
import type { CmsRuntimePayload } from "@/lib/cms/runtime-types";
import { mergeMatchPools } from "@/lib/data/merge-match-pools";
import { getLegacyMatchList } from "@/lib/data/matches";
import { getPrefetched, prefetchJson } from "@/lib/prefetch-cache";

export function CmsRuntimeBootstrap({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<CmsRuntimePayload>(DEFAULT_CMS_RUNTIME);

  useEffect(() => {
    let cancelled = false;

    const applyRuntime = (data: CmsRuntimePayload | null) => {
      if (!cancelled && data?.config) setRuntime(data);
    };

    const loadMatches = async () => {
      try {
        const data = (await prefetchJson("/api/cms/runtime/matches")) as {
          matchPool?: CmsRuntimePayload["matchPool"];
        } | null;
        if (cancelled || !data?.matchPool?.length) return;
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

    async function boot() {
      try {
        const cached = getPrefetched<CmsRuntimePayload>("/api/cms/runtime");
        if (cached?.config) {
          applyRuntime(cached);
        } else {
          const data = (await prefetchJson("/api/cms/runtime")) as CmsRuntimePayload | null;
          applyRuntime(data);
        }
      } catch {
        /* DEFAULT_CMS_RUNTIME */
      } finally {
        if (!cancelled) window.dispatchEvent(new Event("bf-cms-runtime-ready"));
      }
      void loadMatches();
    }

    void boot();

    const onResume = () => void boot();
    window.addEventListener("bf-resume-background-load", onResume);
    return () => {
      cancelled = true;
      window.removeEventListener("bf-resume-background-load", onResume);
    };
  }, []);

  return <CmsRuntimeProvider value={runtime}>{children}</CmsRuntimeProvider>;
}
