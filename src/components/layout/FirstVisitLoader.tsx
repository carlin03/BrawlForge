"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_MS = 350;
const MAX_MS = 5000;

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

function useReactBootReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

declare global {
  interface Window {
    __bfBootHandoff?: (pct?: number) => void;
    __bfBootSetLabel?: (text: string) => void;
    __bfBootDone?: () => void;
  }
}

/**
 * Toma el relevo del loader HTML estático y cierra en cuanto la app puede pintarse.
 * Catálogo, auth y logos siguen cargando en segundo plano.
 */
export function FirstVisitLoader() {
  const pathname = usePathname();
  const windowLoaded = useWindowLoaded();
  const reactReady = useReactBootReady();

  const [active, setActive] = useState(() => !pathname.startsWith("/admin"));
  const [fade, setFade] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [mountedAt] = useState(() => Date.now());
  const [softReady, setSoftReady] = useState(false);

  const domReady = typeof document !== "undefined" && document.readyState !== "loading";

  useEffect(() => {
    window.__bfBootHandoff?.(displayProgress);
    window.__bfBootSetLabel?.("Conectando con BrawlForge…");
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setSoftReady(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  const stages: BootStage[] = useMemo(
    () => [
      { id: "boot", label: "Iniciando BrawlForge…", weight: 25, done: reactReady },
      { id: "dom", label: "Preparando interfaz…", weight: 35, done: domReady },
      { id: "shell", label: "Abriendo la web…", weight: 40, done: windowLoaded || softReady },
    ],
    [domReady, windowLoaded, reactReady, softReady],
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
    window.__bfBootHandoff?.(targetProgress);
    window.__bfBootSetLabel?.(stageLabel);
  }, [targetProgress, stageLabel]);

  useEffect(() => {
    if (!active || fade) return;

    let raf = 0;
    const tick = () => {
      setDisplayProgress((prev) => {
        const cap = allReady ? 100 : Math.min(targetProgress, 97);
        if (prev >= cap) return prev;
        const step = Math.max(0.8, (cap - prev) * 0.22);
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
      window.__bfBootHandoff?.(100);
      window.__bfBootSetLabel?.("Listo");
      setFade(true);
      window.__bfBootDone?.();
      window.setTimeout(() => setActive(false), 480);
    };

    const check = () => {
      const elapsed = Date.now() - mountedAt;
      if (elapsed >= MAX_MS) {
        finish();
        return;
      }
      if (allReady && elapsed >= MIN_MS) {
        finish();
      }
    };

    const id = window.setInterval(check, 60);
    check();
    return () => window.clearInterval(id);
  }, [active, fade, allReady, mountedAt]);

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
      style={{ zIndex: 2147483647 }}
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
          {allReady ? "Entrando…" : "Los datos se sincronizan en segundo plano."}
        </p>
      </div>
    </div>
  );
}
