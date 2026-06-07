"use client";

import { useEffect } from "react";
import { startBackgroundPrefetch } from "@/lib/prefetch-cache";

/** Arranca descargas de datos al montar y al volver a la pestaña. */
export function BackgroundPrefetch() {
  useEffect(() => {
    startBackgroundPrefetch();

    const onVisibility = () => {
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
  }, []);

  return null;
}
