"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startBackgroundPrefetch } from "@/lib/prefetch-cache";

/** Arranca descargas de datos al montar y al volver a la pestaña. */
export function BackgroundPrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    // Worlds hub: no saturar red/CPU con prefetch agresivo
    if (pathname?.startsWith("/worlds")) return;

    startBackgroundPrefetch();

    const onVisibility = () => {
      if (pathname?.startsWith("/worlds")) return;
      startBackgroundPrefetch();
      if (document.visibilityState === "visible") {
        window.dispatchEvent(new Event("bf-resume-background-load"));
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [pathname]);

  return null;
}
