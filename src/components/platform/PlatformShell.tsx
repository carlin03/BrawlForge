"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/data";
import { GameDock } from "@/components/platform/GameDock";

const SUB_NAV = [
  { label: "Torneos", href: "/tournaments" },
  { label: "Rankings", href: "/rankings" },
  { label: "Equipos", href: "/teams" },
  { label: "Jugadores", href: "/players" },
  { label: "Noticias", href: "/news" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="bp-app bf-game-app">
      <header className="bp-nav bf-game-nav">
        <div className="bp-nav-inner">
          <Link href="/" className="bp-logo bf-game-logo" onClick={() => setOpen(false)}>
            <svg className="bf-game-logo-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.9 6.9L22 9.8l-5.2 4.5L18.2 22 12 18.2 5.8 22l1.4-7.7L2 9.8l7.1-.9L12 2z" />
            </svg>
            Brawl<span>Forge</span>
          </Link>

          <nav className="bp-nav-links" aria-label="Principal">
            {NAV_ITEMS.map((item) => {
              const on = isActive(pathname, item.href);
              const accent = "accent" in item ? item.accent : undefined;
              const cls = [
                "bp-nav-link",
                on ? "is-on" : "",
                accent === "fantasy" ? "is-fantasy" : "",
                accent === "predict" ? "is-vote" : "",
              ].filter(Boolean).join(" ");
              return (
                <Link key={item.href} href={item.href} className={cls} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="bf-nav-actions">
            <Link href="/fantasy" className="bf-nav-cta bf-nav-cta-gold" onClick={() => setOpen(false)}>
              Mi plantilla
            </Link>
            <Link href="/predictions" className="bf-nav-cta bf-nav-cta-red" onClick={() => setOpen(false)}>
              Votar
            </Link>
          </div>

          <button type="button" className="bp-nav-toggle" aria-label="Menú" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="bf-subnav" aria-label="Explorar">
          {SUB_NAV.map((item) => {
            const on = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bf-subnav-link ${on ? "is-on" : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav className={`bp-nav-mobile ${open ? "is-open" : ""}`} aria-label="Móvil">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="bp-nav-link" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {SUB_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="bf-subnav-link" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="bp-main bf-game-main">{children}</main>
      <GameDock />
    </div>
  );
}
