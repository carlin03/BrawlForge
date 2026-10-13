"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCmsHome } from "@/contexts/CmsRuntimeContext";
import { HomeView } from "@/components/platform/HomeView";
import { HomeViewRenderer } from "@/components/cms/HomeViewRenderer";
import { useWorldsMode } from "@/contexts/WorldsModeContext";

/**
 * En modo Worlds la home redirige al hub /worlds (experiencia Mundial).
 * Classic mantiene HomeView / CMS home builder.
 */
export function HomePageRouter() {
  const home = useCmsHome();
  const { isWorlds, ready } = useWorldsMode();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (isWorlds) router.replace("/worlds");
  }, [ready, isWorlds, router]);

  if (!ready) {
    return (
      <div className="wf-hub" style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
        <p className="wf-kicker">Cargando Worlds 2026…</p>
      </div>
    );
  }

  if (isWorlds) {
    return (
      <div className="wf-hub" style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
        <p className="wf-kicker">Entrando al hub Worlds 2026…</p>
      </div>
    );
  }

  if (!home.enabled) return <HomeView />;
  return <HomeViewRenderer home={home} />;
}
