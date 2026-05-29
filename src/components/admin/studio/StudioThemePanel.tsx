"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DEFAULT_THEME_TOKENS } from "@/lib/cms/defaults";
import { StudioColorPicker, StudioLoading, StudioPanel, StudioToast } from "./studio-ui";

type ThemeColors = typeof DEFAULT_THEME_TOKENS.colors;

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: "bg", label: "Fondo general" },
  { key: "surface", label: "Superficies" },
  { key: "panel", label: "Paneles y tarjetas" },
  { key: "text", label: "Texto principal" },
  { key: "muted", label: "Texto secundario" },
  { key: "primary", label: "Azul principal" },
  { key: "secondary", label: "Dorado / acento" },
  { key: "success", label: "Éxito (verde)" },
  { key: "error", label: "Error (rojo)" },
  { key: "warning", label: "Aviso" },
];

export function StudioThemePanel() {
  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_THEME_TOKENS.colors });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/admin/theme");
      const data = await res.json();
      if (res.ok) {
        const sets = data.sets as { tokens?: { colors?: ThemeColors } }[] | undefined;
        const active = sets?.[0];
        if (active?.tokens?.colors) {
          setColors({ ...DEFAULT_THEME_TOKENS.colors, ...active.tokens.colors });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/cms/admin/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "global-default",
        tokens: { colors, layout: DEFAULT_THEME_TOKENS.layout },
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Colores guardados. Recarga la web pública para verlos." : data.error);
    setError(!res.ok);
    setSaving(false);
  }

  if (loading) return <StudioLoading />;

  return (
    <StudioPanel
      title="Colores y diseño"
      lead="Elige colores con el selector visual. No hace falta escribir códigos a mano."
      actions={
        <button type="button" className="bp-btn bp-btn-ghost" onClick={load}>
          <RefreshCw size={16} /> Restaurar vista
        </button>
      }
    >
      <div
        className="bf-studio-theme-preview"
        style={{ background: colors.bg, color: colors.text, borderColor: colors.primary }}
      >
        <span style={{ color: colors.primary }}>Vista previa</span>
        <p style={{ color: colors.muted }}>Así se verán fondos y textos.</p>
        <button type="button" style={{ background: colors.secondary, color: "#111", padding: "8px 16px", borderRadius: 8 }}>
          Botón de ejemplo
        </button>
      </div>

      <div className="bf-studio-color-grid">
        {COLOR_FIELDS.map(({ key, label }) => (
          <StudioColorPicker
            key={key}
            label={label}
            value={colors[key]}
            onChange={(v) => setColors((c) => ({ ...c, [key]: v }))}
          />
        ))}
      </div>

      <button type="button" className="bp-btn bp-btn-gold" onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Guardar colores"}
      </button>
      <StudioToast message={msg} error={error} />
    </StudioPanel>
  );
}
