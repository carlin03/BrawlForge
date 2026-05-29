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
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";
import type { LogoOverridesFile } from "@/lib/data/logo-overrides";
import type { LogoRuntimeConfig } from "@/lib/data/png-logo-urls";

const DEFAULT: LogoRuntimeConfig = {
  cacheVersion: LOGO_CACHE_VERSION,
  overrides: { teams: {}, tournaments: {} },
};

export type { LogoRuntimeConfig };

const LogoConfigContext = createContext<{
  config: LogoRuntimeConfig;
  refresh: () => Promise<void>;
}>({ config: DEFAULT, refresh: async () => {} });

export function LogoConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LogoRuntimeConfig>(DEFAULT);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/logos/config", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setConfig({
        cacheVersion: String(data.cacheVersion ?? LOGO_CACHE_VERSION),
        overrides: data.overrides ?? { teams: {}, tournaments: {} },
      });
    } catch {
      /* mantener último config */
    }
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("bf-logos-updated", onUpdate);
    return () => window.removeEventListener("bf-logos-updated", onUpdate);
  }, [refresh]);

  const value = useMemo(() => ({ config, refresh }), [config, refresh]);

  return <LogoConfigContext.Provider value={value}>{children}</LogoConfigContext.Provider>;
}

export function useLogoConfig() {
  return useContext(LogoConfigContext).config;
}

export function useRefreshLogos() {
  return useContext(LogoConfigContext).refresh;
}

/** Llamar tras guardar un logo en admin */
export function notifyLogosUpdated(detail?: { cacheVersion?: string; logoUrl?: string }) {
  window.dispatchEvent(new CustomEvent("bf-logos-updated", { detail }));
}
