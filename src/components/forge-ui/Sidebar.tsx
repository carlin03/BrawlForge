"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Home,
  Gamepad2,
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
import { NAV_ITEMS } from "@/lib/data";

const ICONS: Record<string, ReactNode> = {
  "/": <Home size={16} />,
  "/fantasy": <Gamepad2 size={16} />,
  "/predictions": <Flame size={16} />,
  "/pickems": <Trophy size={16} />,
  "/matches": <Swords size={16} />,
  "/tournaments": <LayoutGrid size={16} />,
  "/rankings": <Medal size={16} />,
  "/teams": <Users size={16} />,
  "/players": <UserCircle size={16} />,
  "/news": <Newspaper size={16} />,
};

const PLAY = ["/", "/fantasy", "/predictions", "/pickems", "/matches"];
const DATA = ["/tournaments", "/rankings", "/teams", "/players", "/news"];

function active(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function itemClass(pathname: string, href: string, accent?: string) {
  if (!active(pathname, href)) return "x-nav-item";
  if (accent === "fantasy") return "x-nav-item is-on-blue";
  if (accent === "predict") return "x-nav-item is-on-red";
  return "x-nav-item is-on";
}

export function Sidebar() {
  const pathname = usePathname();
  const play = NAV_ITEMS.filter((i) => PLAY.includes(i.href));
  const data = NAV_ITEMS.filter((i) => DATA.includes(i.href));

  return (
    <>
      <aside className="x-sidebar">
        <Link href="/" className="x-sidebar-logo">
          <BrandMark size={26} />
          <span>
            BRAWL<em>FORGE</em>
          </span>
        </Link>

        <nav className="x-sidebar-nav">
          <div className="x-nav-group">Jugar</div>
          {play.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={itemClass(pathname, item.href, "accent" in item ? item.accent : undefined)}
            >
              {ICONS[item.href]}
              {item.label}
            </Link>
          ))}

          <div className="x-nav-group">Datos</div>
          {data.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(pathname, item.href)}>
              {ICONS[item.href]}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="x-sidebar-foot">
          <Link href="/fantasy" className="x-btn x-btn-gold" style={{ width: "100%", justifyContent: "center" }}>
            Mi plantilla
          </Link>
        </div>
      </aside>

      <nav className="x-mobile-bar" aria-label="Móvil">
        {NAV_ITEMS.slice(0, 6).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`x-mobile-link ${active(pathname, item.href) ? "is-on" : ""}`}
          >
            {ICONS[item.href]}
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
