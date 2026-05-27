"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Home,
  ClipboardList,
  Flame,
  Trophy,
  Swords,
  Medal,
  Users,
  UserCircle,
  Newspaper,
  LayoutGrid,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { NovaHeader } from "@/components/nova/NovaHeader";
import { NAV_ITEMS } from "@/lib/data";

const ICONS: Record<string, ReactNode> = {
  "/": <Home size={18} />,
  "/fantasy": <ClipboardList size={18} />,
  "/predictions": <Flame size={18} />,
  "/pickems": <Trophy size={18} />,
  "/matches": <Swords size={18} />,
  "/tournaments": <LayoutGrid size={18} />,
  "/rankings": <Medal size={18} />,
  "/teams": <Users size={18} />,
  "/players": <UserCircle size={18} />,
  "/news": <Newspaper size={18} />,
};

function active(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function railClass(pathname: string, href: string, accent?: string) {
  if (!active(pathname, href)) return "nv-rail-link";
  if (accent === "fantasy") return "nv-rail-link is-on-yellow";
  if (accent === "predict") return "nv-rail-link is-on-red";
  return "nv-rail-link is-on";
}

export function NovaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="nv-app">
      <aside className="nv-rail">
        <Link href="/" className="nv-rail-logo" title="BrawlForge">
          <BrandMark size={32} />
        </Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={railClass(pathname, item.href, "accent" in item ? item.accent : undefined)}
            title={item.label}
          >
            {ICONS[item.href]}
          </Link>
        ))}
      </aside>

      <div className="nv-frame">
        <NovaHeader />
        <div className="nv-body">{children}</div>
      </div>

      <nav className="nv-mobile-nav">
        {NAV_ITEMS.slice(0, 7).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nv-rail-link ${active(pathname, item.href) ? "is-on" : ""}`}
            style={{ flex: 1, borderRadius: 0, height: "100%" }}
          >
            {ICONS[item.href]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
