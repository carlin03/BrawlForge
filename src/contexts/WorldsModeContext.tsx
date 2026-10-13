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

const STORAGE_KEY = "bf-site-experience";

type WorldsModeContextValue = {
  experience: SiteExperience;
  isWorlds: boolean;
  setExperience: (next: SiteExperience) => void;
  toggle: () => void;
  ready: boolean;
};

const WorldsModeContext = createContext<WorldsModeContextValue | null>(null);

function readStored(): SiteExperience {
  if (typeof window === "undefined") return "classic";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "worlds" ? "worlds" : "classic";
  } catch {
    return "classic";
  }
}

export function WorldsModeProvider({ children }: { children: ReactNode }) {
  const [experience, setExperienceState] = useState<SiteExperience>("classic");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setExperienceState(readStored());
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
