"use client";

import { createContext, useContext } from "react";
import type { CmsRuntimePayload } from "@/lib/cms/runtime";
import { setRuntimeMatchPool } from "@/lib/data/match-pool";

const CmsRuntimeContext = createContext<CmsRuntimePayload | null>(null);

export function CmsRuntimeProvider({
  value,
  children,
}: {
  value: CmsRuntimePayload;
  children: React.ReactNode;
}) {
  setRuntimeMatchPool(value.matchPool);
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
