"use client";

import { StudioModulePanel } from "./StudioModulePanel";

export function StudioCardsPanel() {
  return (
    <StudioModulePanel
      title="Card Builder (Fase 6)"
      description="Plantillas team/player. Activa cms.cards.enabled."
      apiPath="/api/cms/admin/cards"
    />
  );
}
