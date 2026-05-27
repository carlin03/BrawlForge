"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, userPredictorProfile } from "@/lib/data";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ForgeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="fg-app">
      <header className="fg-nav">
        <div className="fg-nav-inner">
          <Link href="/" className="fg-logo">Brawl<em>Forge</em></Link>
          <nav className="fg-nav-links" aria-label="Principal">
            {NAV_ITEMS.map((item) => {
              const on = isActive(pathname, item.href);
              const accent = "accent" in item ? item.accent : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[on ? "is-on" : "", accent === "fantasy" ? "fantasy" : "", accent === "predict" ? "predict" : ""].filter(Boolean).join(" ") || undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <span className="fg-nav-user">{userPredictorProfile.totalPoints.toLocaleString()} pts</span>
          <button type="button" className="fg-nav-toggle" aria-label="Menú" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <nav className={`fg-nav-mobile ${open ? "is-open" : ""}`}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "is-on" : undefined} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="fg-main">{children}</main>
      <footer className="fg-foot">BrawlForge · Fantasy & predictions para el BSC · Fan project</footer>
    </div>
  );
}
