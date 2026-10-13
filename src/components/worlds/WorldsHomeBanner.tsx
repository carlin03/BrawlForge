"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useWorldsMode } from "@/contexts/WorldsModeContext";

export function WorldsHomeBanner() {
  const { isWorlds, ready } = useWorldsMode();
  if (!ready || !isWorlds) return null;

  return (
    <aside className="wf-home-banner" aria-label="Modo Worlds activo">
      <p>
        <Trophy size={16} aria-hidden style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
        Estás en modo <strong>Worlds 2026</strong> — el Classic sigue ahí con un clic.
      </p>
      <Link href="/worlds">Abrir hub Worlds →</Link>
    </aside>
  );
}
