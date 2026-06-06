"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useLogoConfigReady } from "@/contexts/LogoConfigContext";
import { useNewsReady } from "@/contexts/NewsContext";

const MIN_MS = 900;
const MAX_MS = 12000;

type BootStage = {
  id: string;
  label: string;
  weight: number;
  done: boolean;
};

function useWindowLoaded() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (document.readyState === "complete") {
      setLoaded(true);
      return;
    }
    const onLoad = () => setLoaded(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return loaded;
}

/**
 * Pantalla de arranque 0–100 % hasta que auth, catálogo, logos y recursos estén listos.
 * Se muestra en cada entrada al sitio (recarga / nueva pestaña), no en navegación interna.
 */
export function FirstVisitLoader() {
  const pathname = usePathname();
  const { loading: authLoading } = useAuth();
  const { ready: catalogReady } = useCatalog();
  const logosReady = useLogoConfigReady();
  const newsReady = useNewsReady();
  const windowLoaded = useWindowLoaded();

  const [active, setActive] = useState(() => !pathname.startsWith("/admin"));
  const [fade, setFade] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [mountedAt] = useState(() => Date.now());

  const domReady = typeof document !== "undefined" && document.readyState !== "loading";

  const stages: BootStage[] = useMemo(
    () => [
      { id: "boot", label: "Iniciando BrawlForge…", weight: 12, done: true },
      { id: "dom", label: "Preparando interfaz…", weight: 13, done: domReady },
      { id: "assets", label: "Cargando recursos…", weight: 15, done: windowLoaded },
      { id: "auth", label: "Comprobando sesión…", weight: 15, done: !authLoading },
      { id: "catalog", label: "Sincronizando equipos y torneos…", weight: 25, done: catalogReady },
      { id: "logos", label: "Aplicando logos…", weight: 10, done: logosReady },
      { id: "news", label: "Actualizando noticias…", weight: 10, done: newsReady },
    ],
    [domReady, windowLoaded, authLoading, catalogReady, logosReady, newsReady],
  );

  const targetProgress = useMemo(() => {
    const total = stages.reduce((s, st) => s + st.weight, 0);
    const done = stages.filter((st) => st.done).reduce((s, st) => s + st.weight, 0);
    return Math.round((done / total) * 100);
  }, [stages]);

  const stageLabel = useMemo(() => {
    const pending = stages.find((st) => !st.done);
    return pending?.label ?? "Listo";
  }, [stages]);

  const allReady = stages.every((st) => st.done);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setActive(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!active || fade) return;

    let raf = 0;
    const tick = () => {
      setDisplayProgress((prev) => {
        const cap = allReady ? 100 : Math.min(targetProgress, 96);
        if (prev >= cap) return prev;
        const step = Math.max(0.35, (cap - prev) * 0.14);
        return Math.min(prev + step, cap);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, fade, targetProgress, allReady]);

  useEffect(() => {
    if (!active || fade) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setDisplayProgress(100);
      setFade(true);
      window.setTimeout(() => setActive(false), 550);
    };

    const check = () => {
      const elapsed = Date.now() - mountedAt;
      if (elapsed >= MAX_MS) {
        finish();
        return;
      }
      if (displayProgress >= 99 && allReady && elapsed >= MIN_MS) {
        finish();
      }
    };

    const id = window.setInterval(check, 80);
    check();
    return () => window.clearInterval(id);
  }, [active, fade, allReady, displayProgress, mountedAt]);

  useEffect(() => {
    if (!active) {
      document.body.classList.remove("bf-boot-loading");
      return;
    }
    document.body.classList.add("bf-boot-loading");
    return () => document.body.classList.remove("bf-boot-loading");
  }, [active]);

  if (!active) return null;

  const pct = Math.round(Math.min(100, Math.max(0, displayProgress)));

  return (
    <div
      className={`bf-first-visit-loader ${fade ? "is-fading" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Cargando BrawlForge, ${pct} por ciento`}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="bf-first-visit-loader-inner">
        <p className="bf-first-visit-loader-brand">BrawlForge</p>
        <p className="bf-first-visit-loader-text">{stageLabel}</p>
        <p className="bf-first-visit-loader-pct" aria-hidden>
          {pct}%
        </p>
        <div className="bf-first-visit-loader-bar" aria-hidden>
          <span className="bf-first-visit-loader-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="bf-first-visit-loader-hint">
          {allReady && pct >= 99
            ? "Abriendo la web…"
            : "Más datos competitivos = un poco más de espera la primera vez."}
        </p>
      </div>
    </div>
  );
}
