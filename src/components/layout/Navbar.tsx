"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Zap } from "lucide-react";
import { NAV_ITEMS } from "@/lib/data";
import { BrandMark } from "@/components/ui/BrandMark";

const PRIMARY = ["/", "/fantasy", "/predictions", "/pickems", "/matches"];
const SECONDARY = ["/tournaments", "/rankings", "/teams", "/players", "/news"];

function linkClass(pathname: string, href: string, accent?: string) {
  const on = pathname === href || (href !== "/" && pathname.startsWith(href));
  if (!on) return "es-nav-link";
  if (accent === "fantasy") return "es-nav-link is-active-blue";
  if (accent === "predict") return "es-nav-link is-active-red";
  return "es-nav-link is-active";
}

export function Navbar() {
  const pathname = usePathname();
  const all = NAV_ITEMS.filter((i) => [...PRIMARY, ...SECONDARY].includes(i.href));

  return (
    <header className="es-nav">
      <div className="es-nav-inner">
        <Link href="/" className="es-nav-logo">
          <BrandMark size={28} />
          <span className="es-nav-brand">
            BRAWL<em>FORGE</em>
          </span>
        </Link>

        <nav className="es-nav-links" aria-label="Principal">
          {all.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(pathname, item.href, "accent" in item ? item.accent : undefined)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="es-nav-actions">
          <Link href="/fantasy" className="es-btn es-btn-gold es-btn-sm hidden sm:inline-flex">
            <Zap className="h-3.5 w-3.5" />
            Arena
          </Link>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--es-border)] bg-[var(--es-panel)] text-[var(--es-muted)] hover:text-[var(--es-text)]"
            aria-label="Cuenta"
          >
            <User className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <nav className="es-nav-mobile" aria-label="Móvil">
        {all.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={linkClass(pathname, item.href, "accent" in item ? item.accent : undefined)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
