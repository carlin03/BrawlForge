"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { NAV_ITEMS } from "@/lib/data";

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export function PulseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="pl-app">
      <header className="pl-nav">
        <Link href="/" className="pl-nav-brand">
          <BrandMark size={36} />
          <span className="pl-nav-logo-text">Brawl<em>Forge</em></span>
        </Link>

        <nav className="pl-nav-links" aria-label="Principal">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const cls =
              active && "accent" in item && item.accent === "predict"
                ? "pl-nav-link is-active-red"
                : active
                  ? "pl-nav-link is-active"
                  : "pl-nav-link";
            return (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <span className="pl-nav-user">2.340 pts</span>
      </header>

      <main className="pl-main">{children}</main>
    </div>
  );
}
