"use client";

import { useEffect } from "react";

/** Cierra el loader HTML en cuanto React hidrata (componente mínimo, sin dependencias pesadas). */
export function BootRelease() {
  useEffect(() => {
    window.__bfBootHandoff?.(90);
    window.__bfBootSetLabel?.("Abriendo la web…");
    const t = window.setTimeout(() => window.__bfBootDone?.(), 320);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
