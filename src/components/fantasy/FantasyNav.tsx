"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Plantilla", href: "/fantasy" },
  { label: "Clasificación", href: "/fantasy/rankings" },
  { label: "Ligas", href: "/fantasy/leagues" },
];

export function FantasyNav() {
  const pathname = usePathname();

  return (
    <div className="ar-subnav">
      {TABS.map((tab) => {
        const isActive = tab.href === "/fantasy" ? pathname === "/fantasy" : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={isActive ? "is-on" : undefined}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
