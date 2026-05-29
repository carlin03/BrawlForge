"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const INTERVAL_MS = 45_000;

/** Registra última página y tiempo en sitio (perfil Supabase). */
export function ActivityTracker() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const send = (path: string) => {
      void fetch("/api/me/activity", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
    };

    if (pathname && pathname !== lastPath.current) {
      lastPath.current = pathname;
      send(pathname);
    }

    const id = setInterval(() => {
      if (lastPath.current) send(lastPath.current);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [isLoggedIn, pathname]);

  return null;
}
