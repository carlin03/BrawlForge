"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

const QUICK = [
  { href: "/fantasy", label: "Fantasy", className: "fu-btn-gold" },
  { href: "/predictions", label: "Predicciones", className: "fu-btn-red" },
  { href: "/matches", label: "Partidos", className: "fu-btn-ghost" },
  { href: "/tournaments", label: "Torneos", className: "fu-btn-ghost" },
  { href: "/profile", label: "Mi perfil", className: "fu-btn-ghost" },
] as const;

/** Barra rápida bajo el nav global (el perfil premium está arriba a la derecha en la barra principal). */
export function HomeSiteHeader() {
  return (
    <section className="bf-home-site-header bf-home-quick-bar" id="home-cabecera" aria-label="Accesos rápidos">
      <div className="bf-home-site-header-bg" aria-hidden />
      <div className="bf-home-site-header-inner">
        <p className="bf-home-quick-bar-label">
          <Sparkles size={14} aria-hidden />
          Circuito BSC 2026 · Tu perfil y club están en la esquina superior derecha
        </p>
        <nav className="bf-home-site-header-nav" aria-label="Accesos rápidos">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className={`fu-btn ${q.className}`}>
              {q.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
