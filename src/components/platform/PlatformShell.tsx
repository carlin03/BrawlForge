"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { MAIN_NAV } from "@/lib/nav-config";
import { PlayerProfileMenu } from "@/components/platform/PlayerProfileMenu";
import { AdminFab } from "@/components/admin/AdminFab";
import { useAuth } from "@/contexts/AuthContext";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shell público: solo Mundial 2026. Admin intacto en /admin. */
export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAdmin, loading: authLoading, isLoggedIn } = useAuth();

  useEffect(() => {
    document.documentElement.dataset.bfExperience = "worlds";
    document.documentElement.dataset.wfTheme = "tokyo";
  }, []);

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="bp-app bf-game-app is-worlds-only is-worlds-mode">
      <header className="bp-nav bf-game-nav">
        <div className="bp-nav-inner">
          <Link href="/" className="bp-logo bf-game-logo" onClick={() => setOpen(false)}>
            <svg className="bf-game-logo-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.9 6.9L22 9.8l-5.2 4.5L18.2 22 12 18.2 5.8 22l1.4-7.7L2 9.8l7.1-.9L12 2z" />
            </svg>
            Worlds<span>26</span>
          </Link>

          <nav className="bp-nav-links" aria-label="Mundial">
            {MAIN_NAV.map((item) => {
              const on = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`bp-nav-link ${on ? "is-on" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="bf-nav-actions">
            <PlayerProfileMenu />
            <button type="button" className="bp-nav-toggle" aria-label="Menú" onClick={() => setOpen(!open)}>
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
          {!authLoading && isLoggedIn && (
            <Link href="/profile" className="bp-nav-link" onClick={() => setOpen(false)}>
              Mi perfil
            </Link>
          )}
          {!authLoading && isAdmin && (
            <Link href="/admin" className="bp-nav-link is-admin-nav" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
        </nav>
      </header>

      <main className="bp-main bf-game-main">{children}</main>
      <AdminFab />
    </div>
  );
}
