"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";

const STORAGE_KEY = "bf_first_visit_loader_v1";
const MIN_MS = 1400;
const MAX_MS = 4800;

/**
 * Pantalla "Cargando" la primera vez que abres el sitio en este navegador.
 * Al desvanecerse, el contenido de abajo ya va apareciendo (catálogo, auth, votos).
 */
export function FirstVisitLoader() {
  const pathname = usePathname();
  const { loading: authLoading } = useAuth();
  const { ready: catalogReady } = useCatalog();
  const [active, setActive] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    setActive(true);
  }, [pathname]);

  useEffect(() => {
    if (!active || fade) return;

    const t0 = Date.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      setFade(true);
      window.setTimeout(() => {
        setActive(false);
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {
          /* ignore */
        }
      }, 650);
    };

    const tick = () => {
      const elapsed = Date.now() - t0;
      const dataReady = !authLoading && catalogReady;
      if (elapsed >= MAX_MS) {
        finish();
        return;
      }
      if (elapsed >= MIN_MS && dataReady) {
        finish();
        return;
      }
    };

    const id = window.setInterval(tick, 120);
    tick();
    return () => window.clearInterval(id);
  }, [active, fade, authLoading, catalogReady]);

  if (!active) return null;

  return (
    <div
      className={`bf-first-visit-loader ${fade ? "is-fading" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando BrawlForge"
    >
      <div className="bf-first-visit-loader-inner">
        <p className="bf-first-visit-loader-brand">BrawlForge</p>
        <p className="bf-first-visit-loader-text">Cargando…</p>
        <div className="bf-first-visit-loader-bar" aria-hidden>
          <span className="bf-first-visit-loader-bar-fill" />
        </div>
        <p className="bf-first-visit-loader-hint">Preparando equipos, partidos y predicciones…</p>
      </div>
    </div>
  );
}
