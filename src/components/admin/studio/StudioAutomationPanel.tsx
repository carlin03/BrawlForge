"use client";

import { StudioModulePanel } from "./StudioModulePanel";

export function StudioAutomationPanel() {
  return (
    <StudioModulePanel
      title="Automatización (Fase 10)"
      description="Reglas if/then y jobs programados. Activa cms.automation.enabled."
      apiPath="/api/cms/admin/automation"
    />
  );
}
