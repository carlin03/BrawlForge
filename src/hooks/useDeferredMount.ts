"use client";

import { useEffect, useState } from "react";

/**
 * Monta UI pesada tras un breve delay.
 * Usa setTimeout (no idle) para que avance aunque la pestaña esté en segundo plano.
 */
export function useDeferredMount(delayMs = 1200): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  return mounted;
}
