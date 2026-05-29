"use client";

import type { ResolvedHomePage } from "@/lib/cms/resolve/home";
import { HomeView } from "@/components/platform/HomeView";

/**
 * Home Builder: cuando hay bloques publicados en CMS, delega al HomeView legacy
 * por bloque hasta extraer cada sección. Misma UX que HomeView completo.
 */
export function HomeViewRenderer({ home }: { home: ResolvedHomePage }) {
  const blocks = home.sections.flatMap((s) => s.blocks).filter((b) => b.enabled);
  if (!blocks.length) return <HomeView />;

  // Fase 4 MVP: un solo render legacy garantiza paridad visual.
  // Los bloques CMS controlan orden/visibilidad en futuras iteraciones sin romper UX.
  void blocks;
  void home.clubSlugs;
  void home.matchLimits;
  return <HomeView />;
}
