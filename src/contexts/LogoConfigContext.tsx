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
import { getPrefetched, prefetchJson } from "@/lib/prefetch-cache";

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
  const [ready, setReady] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data =
        getPrefetched<{ cacheVersion?: string; overrides?: LogoOverridesFile }>("/api/logos/config") ??
        ((await prefetchJson("/api/logos/config")) as {
          cacheVersion?: string;
          overrides?: LogoOverridesFile;
        } | null);
      if (!data) return;
      const raw: LogoOverridesFile = data.overrides ?? { teams: {}, tournaments: {} };
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
    void refresh();
    const onResume = () => void refresh();
    window.addEventListener("bf-resume-background-load", onResume);
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
    return () => {
      window.removeEventListener("bf-resume-background-load", onResume);
      window.removeEventListener("bf-logos-updated", onUpdate);
    };
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
