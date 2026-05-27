"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, FOOTER_LINKS, userPredictorProfile } from "@/lib/data";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function VictoryBackground() {
  return (
    <div className="ar-bg-fx" aria-hidden>
      <div className="ar-bg-orb ar-bg-orb-1" />
      <div className="ar-bg-orb ar-bg-orb-2" />
      <div className="ar-bg-orb ar-bg-orb-3" />
    </div>
  );
}

export function ArenaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="ar-app">
      <VictoryBackground />
      <header className="ar-top">
        <div className="ar-top-inner">
          <Link href="/" className="ar-logo">Brawl<span>Forge</span></Link>

          <nav className="ar-nav" aria-label="Principal">
            {NAV_ITEMS.map((item) => {
              const on = isActive(pathname, item.href);
              const accent = "accent" in item ? item.accent : undefined;
              const classes = [
                on ? "is-on" : "",
                accent === "predict" ? "is-vote" : "",
                accent === "fantasy" ? "is-pick" : "",
              ].filter(Boolean).join(" ");
              return (
                <Link key={item.href} href={item.href} className={classes || undefined}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <span className="ar-user">{userPredictorProfile.totalPoints.toLocaleString()} pts</span>

          <button type="button" className="ar-nav-toggle" aria-label="Menú" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <nav className={`ar-nav-more ${menuOpen ? "is-open" : ""}`} aria-label="Móvil">
            {[...NAV_ITEMS, ...FOOTER_LINKS.map((l) => ({ label: l.label, href: l.href }))].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="ar-main">{children}</main>

      <footer className="ar-foot">
        <div className="ar-foot-links">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>
        <p className="ar-foot-copy">BSC 2026 · Fan project · No afiliado a Supercell</p>
      </footer>
    </div>
  );
}
