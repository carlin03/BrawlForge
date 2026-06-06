"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const MatchPoolRefreshContext = createContext(0);

export function MatchPoolRefreshProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const bump = () => setKey((k) => k + 1);
    window.addEventListener("bf-match-pool-updated", bump);
    window.addEventListener("bf-cms-runtime-ready", bump);
    return () => {
      window.removeEventListener("bf-match-pool-updated", bump);
      window.removeEventListener("bf-cms-runtime-ready", bump);
    };
  }, []);

  return (
    <MatchPoolRefreshContext.Provider value={key}>{children}</MatchPoolRefreshContext.Provider>
  );
}

export function useMatchPoolRefreshKey(): number {
  return useContext(MatchPoolRefreshContext);
}
