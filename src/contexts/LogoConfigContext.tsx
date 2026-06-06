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
import type { LogoOverrideEntry, LogoOverridesFile } from "@/lib/data/logo-overrides";
import { isHiddenTeamSlug } from "@/lib/data/blocked-team-slugs";
import type { LogoRuntimeConfig } from "@/lib/data/png-logo-urls";

const DEFAULT: LogoRuntimeConfig = {
  cacheVersion: LOGO_CACHE_VERSION,
  overrides: { teams: {}, tournaments: {} },
};

export type { LogoRuntimeConfig };

const LogoConfigContext = createContext<{
  config: LogoRuntimeConfig;
  ready: boolean;
  refresh: () => Promise<void>;
}>({ config: DEFAULT, ready: false, refresh: async () => {} });

export function LogoConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LogoRuntimeConfig>(DEFAULT);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/logos/config", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const raw = data.overrides ?? { teams: {}, tournaments: {} };
      const teams: LogoOverridesFile["teams"] = {};
      for (const [slug, entry] of Object.entries(raw.teams ?? {})) {
        if (!isHiddenTeamSlug(slug)) teams[slug] = entry as LogoOverrideEntry;
      }
      setConfig({
        cacheVersion: String(data.cacheVersion ?? LOGO_CACHE_VERSION),
        overrides: { teams, tournaments: raw.tournaments ?? {} },
      });
    } catch {
      /* mantener último config */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ slug?: string; logoUrl?: string; cacheVersion?: string; kind?: string }>)
        .detail;
      if (detail?.slug && detail.logoUrl && detail.kind !== "tournament") {
        const url = String(detail.logoUrl).split("?")[0];
        const slug = detail.slug.trim().toLowerCase();
        setConfig((prev) => ({
          cacheVersion: String(detail.cacheVersion ?? prev.cacheVersion ?? LOGO_CACHE_VERSION),
          overrides: {
            teams: {
              ...prev.overrides?.teams,
              [slug]: { url, customOnly: true, treatment: "raw" },
            },
            tournaments: prev.overrides?.tournaments ?? {},
          },
        }));
      }
      void refresh();
    };
    window.addEventListener("bf-logos-updated", onUpdate);
    return () => window.removeEventListener("bf-logos-updated", onUpdate);
  }, [refresh]);

  const value = useMemo(() => ({ config, ready, refresh }), [config, ready, refresh]);

  return <LogoConfigContext.Provider value={value}>{children}</LogoConfigContext.Provider>;
}

export function useLogoConfig() {
  return useContext(LogoConfigContext).config;
}

export function useLogoConfigReady() {
  return useContext(LogoConfigContext).ready;
}

export function useRefreshLogos() {
  return useContext(LogoConfigContext).refresh;
}

/** Llamar tras guardar un logo en admin */
export function notifyLogosUpdated(detail?: {
  cacheVersion?: string;
  logoUrl?: string;
  slug?: string;
  kind?: "team" | "tournament";
}) {
  window.dispatchEvent(new CustomEvent("bf-logos-updated", { detail }));
}
