"use client";

import { StudioModulePanel } from "./StudioModulePanel";

export function StudioPredictionsPanel() {
  return (
    <StudioModulePanel
      title="Predicciones (Fase 7)"
      description="Scoring y mercados. Activa cms.predictions_config.enabled."
      apiPath="/api/cms/admin/predictions"
    />
  );
}
