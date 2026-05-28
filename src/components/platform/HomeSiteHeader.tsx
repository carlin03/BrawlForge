import Link from "next/link";
import { Sparkles } from "lucide-react";

const QUICK = [
  { href: "/fantasy", label: "Fantasy", className: "fu-btn-gold" },
  { href: "/predictions", label: "Predicciones", className: "fu-btn-red" },
  { href: "/matches", label: "Partidos", className: "fu-btn-ghost" },
  { href: "/tournaments", label: "Torneos", className: "fu-btn-ghost" },
] as const;

export function HomeSiteHeader() {
  return (
    <header className="bf-home-site-header" id="home-cabecera">
      <div className="bf-home-site-header-bg" aria-hidden />
      <div className="bf-home-site-header-inner">
        <div className="bf-home-site-header-brand">
          <Sparkles size={18} className="bf-home-site-header-icon" aria-hidden />
          <div>
            <p className="bf-home-site-header-kicker">
              <span className="bp-live-dot" /> Brawl Stars Championship · 2026
            </p>
            <h1 className="bf-home-site-header-title">
              Brawl<em>Forge</em>
            </h1>
          </div>
        </div>
        <nav className="bf-home-site-header-nav" aria-label="Accesos rápidos">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className={`fu-btn ${q.className}`}>
              {q.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
