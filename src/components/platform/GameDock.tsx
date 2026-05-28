"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Trophy, Users, Sparkles, Target } from "lucide-react";

const DOCK: {
  href: string;
  label: string;
  icon: typeof Home;
  accent?: "gold" | "red";
}[] = [
  { href: "/", label: "Arena", icon: Home },
  { href: "/fantasy", label: "Fantasy", icon: Sparkles, accent: "gold" },
  { href: "/predictions", label: "Predicciones", icon: Target, accent: "red" },
  { href: "/matches", label: "Partidos", icon: Swords },
  { href: "/tournaments", label: "Torneos", icon: Trophy },
  { href: "/teams", label: "Clubes", icon: Users },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GameDock() {
  const pathname = usePathname();

  return (
    <nav className="bf-game-dock" aria-label="Acceso rápido">
      {DOCK.map(({ href, label, icon: Icon, accent }) => {
        const on = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`bf-game-dock-item ${on ? "is-on" : ""} ${accent ? `accent-${accent}` : ""}`}
          >
            <span className="bf-game-dock-icon">
              <Icon size={20} strokeWidth={on ? 2.5 : 2} />
            </span>
            <span className="bf-game-dock-label">{label}</span>
            {on && <span className="bf-game-dock-pip" aria-hidden />}
          </Link>
        );
      })}
    </nav>
  );
}
