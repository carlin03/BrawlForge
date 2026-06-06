"use client";

import { useEffect, useState } from "react";

/** Monta contenido pesado tras el primer paint (evita bloquear móvil). */
export function useDeferredMount(delayMs = 1200): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const run = () => setMounted(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: delayMs });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  return mounted;
}
