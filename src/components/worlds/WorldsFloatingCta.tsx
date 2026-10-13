"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { useWorldsMode } from "@/contexts/WorldsModeContext";

/** CTA flotante imposible de perder si no estás ya en /worlds. */
export function WorldsFloatingCta() {
  const pathname = usePathname();
  const { isWorlds, setExperience, ready } = useWorldsMode();

  if (!ready) return null;
  if (pathname.startsWith("/worlds") || pathname.startsWith("/admin")) return null;

  return (
    <Link
      href="/worlds"
      className="wf-float-cta"
      onClick={() => setExperience("worlds")}
      aria-label="Abrir Worlds 2026"
    >
      <Trophy size={16} aria-hidden />
      {isWorlds ? "Hub Worlds" : "Entrar Worlds 2026"}
    </Link>
  );
}
