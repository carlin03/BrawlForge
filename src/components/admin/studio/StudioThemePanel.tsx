"use client";

import { StudioModulePanel } from "./StudioModulePanel";

export function StudioThemePanel() {
  return (
    <StudioModulePanel
      title="Theme Engine (Fase 2)"
      description="Edita theme_token_sets. Activa cms.theme.enabled para inyectar CSS en la web."
      apiPath="/api/cms/admin/theme"
    >
      {(data) => (
        <ul className="bf-studio-list">
          {(data.sets as { id: string; name: string; is_active: boolean }[])?.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong> ({s.id}) {s.is_active ? "— activo" : ""}
            </li>
          ))}
        </ul>
      )}
    </StudioModulePanel>
  );
}
