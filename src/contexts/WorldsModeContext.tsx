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

export type SiteExperience = "classic" | "worlds";

/** v2: fuerza Worlds como default de temporada (ignora preferencia classic antigua). */
const STORAGE_KEY = "bf-site-experience-v2";

type WorldsModeContextValue = {
  experience: SiteExperience;
  isWorlds: boolean;
  setExperience: (next: SiteExperience) => void;
  toggle: () => void;
  ready: boolean;
};

const WorldsModeContext = createContext<WorldsModeContextValue | null>(null);

/** Temporada Worlds: por defecto Worlds (Classic sigue disponible). */
const DEFAULT_EXPERIENCE: SiteExperience = "worlds";

function readStored(): SiteExperience {
  if (typeof window === "undefined") return DEFAULT_EXPERIENCE;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "classic" || v === "worlds") return v;
    return DEFAULT_EXPERIENCE;
  } catch {
    return DEFAULT_EXPERIENCE;
  }
}

export function WorldsModeProvider({ children }: { children: ReactNode }) {
  const [experience, setExperienceState] = useState<SiteExperience>(DEFAULT_EXPERIENCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setExperienceState(stored);
    try {
      // Primera visita sin preferencia → Worlds 2026
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, DEFAULT_EXPERIENCE);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setExperience = useCallback((next: SiteExperience) => {
    setExperienceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.dataset.bfExperience = next;
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.bfExperience = experience;
  }, [experience, ready]);

  const toggle = useCallback(() => {
    setExperience(experience === "worlds" ? "classic" : "worlds");
  }, [experience, setExperience]);

  const value = useMemo(
    () => ({
      experience,
      isWorlds: experience === "worlds",
      setExperience,
      toggle,
      ready,
    }),
    [experience, setExperience, toggle, ready],
  );

  return <WorldsModeContext.Provider value={value}>{children}</WorldsModeContext.Provider>;
}

export function useWorldsMode(): WorldsModeContextValue {
  const ctx = useContext(WorldsModeContext);
  if (!ctx) {
    return {
      experience: "classic",
      isWorlds: false,
      setExperience: () => {},
      toggle: () => {},
      ready: false,
    };
  }
  return ctx;
}
