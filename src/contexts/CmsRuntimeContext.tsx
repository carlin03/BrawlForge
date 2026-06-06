"use client";

import { createContext, useContext, useEffect } from "react";
import type { CmsRuntimePayload } from "@/lib/cms/runtime-types";
import { setRuntimeMatchPool } from "@/lib/data/match-pool";

const CmsRuntimeContext = createContext<CmsRuntimePayload | null>(null);

export function CmsRuntimeProvider({
  value,
  children,
}: {
  value: CmsRuntimePayload;
  children: React.ReactNode;
}) {
  useEffect(() => {
    setRuntimeMatchPool(value.matchPool.length ? value.matchPool : null);
    if (value.matchPool.length) {
      window.dispatchEvent(new Event("bf-match-pool-updated"));
    }
  }, [value.matchPool]);

  return <CmsRuntimeContext.Provider value={value}>{children}</CmsRuntimeContext.Provider>;
}

export function useCmsRuntime(): CmsRuntimePayload {
  const ctx = useContext(CmsRuntimeContext);
  if (!ctx) {
    throw new Error("useCmsRuntime requires CmsRuntimeProvider");
  }
  return ctx;
}

export function useCmsNavigation(): CmsRuntimePayload["navigation"] {
  return useCmsRuntime().navigation;
}

export function useOptionalCmsRuntime(): CmsRuntimePayload | null {
  return useContext(CmsRuntimeContext);
}

export function useCmsHome(): CmsRuntimePayload["home"] {
  return useCmsRuntime().home;
}
