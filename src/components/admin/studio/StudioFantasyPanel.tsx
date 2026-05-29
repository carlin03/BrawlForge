"use client";

import { StudioModulePanel } from "./StudioModulePanel";

export function StudioFantasyPanel() {
  return (
    <StudioModulePanel
      title="Fantasy Config (Fase 7)"
      description="Temporadas, reglas y mercado. Activa cms.fantasy_config.enabled."
      apiPath="/api/cms/admin/fantasy"
    />
  );
}
