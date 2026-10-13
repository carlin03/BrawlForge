"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { useWorldsMode } from "@/contexts/WorldsModeContext";

export function WorldsModeToggle() {
  const { isWorlds, setExperience, ready } = useWorldsMode();
  const pathname = usePathname();
  const router = useRouter();

  if (!ready) return null;

  function goWorlds() {
    setExperience("worlds");
    if (!pathname.startsWith("/worlds")) router.push("/worlds");
  }

  function goClassic() {
    setExperience("classic");
    if (pathname.startsWith("/worlds")) router.push("/");
  }

  return (
    <div className="wf-mode-toggle" role="group" aria-label="Modo de experiencia">
      <button
        type="button"
        className={`wf-mode-btn ${!isWorlds ? "is-on" : ""}`}
        onClick={goClassic}
        aria-pressed={!isWorlds}
      >
        Classic
      </button>
      <button
        type="button"
        className={`wf-mode-btn is-worlds ${isWorlds ? "is-on" : ""}`}
        onClick={goWorlds}
        aria-pressed={isWorlds}
      >
        <Trophy size={12} aria-hidden />
        Worlds 2026
      </button>
      {isWorlds && !pathname.startsWith("/worlds") && (
        <Link href="/worlds" className="wf-mode-hub-link" title="Abrir hub Worlds">
          Hub
        </Link>
      )}
    </div>
  );
}
