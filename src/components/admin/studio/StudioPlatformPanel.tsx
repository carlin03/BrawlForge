"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import type { CmsAuditEntry } from "@/lib/cms/types";
import {
  StudioAdvanced,
  StudioCard,
  StudioPanel,
  StudioStat,
  StudioToast,
  StudioLoading,
  humanizeAudit,
} from "./studio-ui";

export function StudioPlatformPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [cmsReady, setCmsReady] = useState(false);
  const [audit, setAudit] = useState<CmsAuditEntry[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/platform");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setCmsReady(Boolean(data.cmsReady));
      setFlags({ ...(data.config?.flags ?? {}) });
      setAudit(data.audit ?? []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function syncFromWeb() {
    setSaving(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/seed-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo sincronizar");
      setMsg("Listo: los datos de la web actual se copiaron al panel. Ya puedes editarlos desde aquí.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setSaving(false);
  }

  const FLAG_FRIENDLY: Record<string, string> = {
    "cms.resolver.enabled": "Sistema de gestión activo",
    "cms.nav.enabled": "Menú editable",
    "cms.theme.enabled": "Colores desde el panel",
    "cms.home_builder.enabled": "Página de inicio editable",
    "cms.matches.enabled": "Partidos en base de datos",
    "cms.catalog.primary": "Catálogo principal online",
    "cms.seo.enabled": "SEO desde el panel",
    "cms.cards.enabled": "Tarjetas personalizables",
    "cms.fantasy_config.enabled": "Fantasy configurable",
    "cms.predictions_config.enabled": "Predicciones configurables",
    "cms.media.enabled": "Biblioteca de medios",
    "cms.automation.enabled": "Automatizaciones",
  };

  if (loading) return <StudioLoading text="Comprobando el sistema…" />;

  return (
    <StudioPanel
      title="Ajustes del sistema"
      lead="Sincronización y estado. No necesitas tocar nada técnico para el uso diario."
    >
      <StudioToast message={msg} error={error} />

      {!cmsReady && (
        <div className="bf-studio-alert" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Falta conectar la base de datos del panel</strong>
            <p>
              Pide a quien te ayude con el proyecto que ejecute el script de instalación en Supabase (una sola
              vez). Después pulsa «Sincronizar desde la web».
            </p>
          </div>
        </div>
      )}

      <div className="bf-studio-stat-row">
        <StudioStat
          label="Estado del panel"
          value={cmsReady ? "Conectado" : "Pendiente"}
          tone={cmsReady ? "ok" : "warn"}
        />
        <StudioStat label="Módulos activos" value={Object.values(flags).filter(Boolean).length} />
        <StudioStat label="Cambios recientes" value={audit.length} />
      </div>

      <StudioCard title="Acción recomendada">
        <p className="bf-studio-hint" style={{ margin: "0 0 14px" }}>
          La primera vez (o tras un despliegue), importa la configuración actual de la web para poder editarla
          desde aquí sin perder nada.
        </p>
        <button type="button" className="bp-btn bp-btn-gold" onClick={syncFromWeb} disabled={saving}>
          <Sparkles size={18} /> Sincronizar desde la web actual
        </button>
      </StudioCard>

      <StudioCard title="Últimos cambios">
        {audit.length === 0 ? (
          <p className="bf-studio-muted">Aún no hay movimientos registrados.</p>
        ) : (
          <ul className="bf-studio-activity">
            {audit.slice(0, 12).map((a) => (
              <li key={a.id}>
                <CheckCircle2 size={14} />
                <span>{humanizeAudit(a.action, a.entityType, a.entityId)}</span>
                <time dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleString("es-ES")}</time>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="bp-btn bp-btn-ghost" style={{ marginTop: 12 }} onClick={load} disabled={saving}>
          <RefreshCw size={16} /> Actualizar historial
        </button>
      </StudioCard>

      <StudioAdvanced title="Opciones técnicas (solo si te lo piden)">
        <p className="bf-studio-muted" style={{ marginBottom: 12 }}>
          Interruptores internos. Déjalos como están salvo indicación de soporte.
        </p>
        <ul className="bf-studio-flag-list">
          {Object.entries(flags).map(([key, enabled]) => (
            <li key={key}>
              <label className="bf-studio-flag-row">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
                />
                <span>
                  <strong>{FLAG_FRIENDLY[key] ?? key}</strong>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="bp-btn bp-btn-ghost"
          style={{ marginTop: 12 }}
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const res = await fetch("/api/cms/admin/platform", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ flags }),
            });
            const data = await res.json();
            setMsg(res.ok ? "Opciones técnicas guardadas" : data.error);
            setError(!res.ok);
            setSaving(false);
            await load();
          }}
        >
          Guardar opciones técnicas
        </button>
      </StudioAdvanced>
    </StudioPanel>
  );
}
