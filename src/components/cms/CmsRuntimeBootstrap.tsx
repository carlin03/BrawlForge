"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CmsRuntimeProvider } from "@/contexts/CmsRuntimeContext";
import { DEFAULT_CMS_RUNTIME } from "@/lib/cms/runtime-defaults";
import type { CmsRuntimePayload } from "@/lib/cms/runtime-types";

export function CmsRuntimeBootstrap({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<CmsRuntimePayload>(DEFAULT_CMS_RUNTIME);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    fetch("/api/cms/runtime", { signal: ac.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CmsRuntimePayload | null) => {
        if (cancelled || !data?.config) return;
        setRuntime(data);
        window.dispatchEvent(new Event("bf-match-pool-updated"));
      })
      .catch(() => {
        /* fallback legacy en cliente */
      })
      .finally(() => {
        if (!cancelled) window.dispatchEvent(new Event("bf-cms-runtime-ready"));
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  return <CmsRuntimeProvider value={runtime}>{children}</CmsRuntimeProvider>;
}
