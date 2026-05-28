"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { MAIN_NAV } from "@/lib/nav-config";
import { PlayerProfileMenu } from "@/components/platform/PlayerProfileMenu";
import { AdminFab } from "@/components/admin/AdminFab";
import { MotionAmbience } from "@/components/platform/MotionAmbience";
import { useAuth } from "@/contexts/AuthContext";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="bp-app bf-game-app bf-ultra-app bf-premium-app bf-motion-app">
      <MotionAmbience />
      <header className="bp-nav bf-game-nav bf-premium-nav">
        <div className="bp-nav-inner">
          <Link href="/" className="bp-logo bf-game-logo" onClick={() => setOpen(false)}>
            <svg className="bf-game-logo-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.9 6.9L22 9.8l-5.2 4.5L18.2 22 12 18.2 5.8 22l1.4-7.7L2 9.8l7.1-.9L12 2z" />
            </svg>
            Brawl<span>Forge</span>
          </Link>

          <nav className="bp-nav-links" aria-label="Principal">
            {MAIN_NAV.map((item) => {
              const on = isActive(pathname, item.href);
              const accent = "accent" in item ? item.accent : undefined;
              const cls = [
                "bp-nav-link",
                on ? "is-on" : "",
                accent === "fantasy" ? "is-fantasy" : "",
                accent === "predict" ? "is-vote" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <Link key={item.href} href={item.href} className={cls} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="bf-nav-actions">
            <PlayerProfileMenu />
            <button
              type="button"
              className="bp-nav-toggle"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <nav className={`bp-nav-mobile ${open ? "is-open" : ""}`} aria-label="Móvil">
          {MAIN_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="bp-nav-link" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {!user && (
            <div className="bp-nav-mobile-auth">
              <Link href="/login" className="bf-nav-auth-btn" onClick={() => setOpen(false)}>
                Entrar
              </Link>
              <Link href="/registro" className="bf-nav-auth-btn is-primary" onClick={() => setOpen(false)}>
                Crear cuenta
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="bp-main bf-game-main bf-page-enter bf-main-ultra">{children}</main>
      <AdminFab />
    </div>
  );
}
