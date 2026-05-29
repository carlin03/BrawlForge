"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Database, RefreshCw, Sparkles } from "lucide-react";
import type { CmsAuditEntry, ResolvedCmsConfig } from "@/lib/cms/types";

const FLAG_LABELS: Record<string, string> = {
  "cms.resolver.enabled": "Motor CMS (Strangler)",
  "cms.nav.enabled": "Navegación desde base de datos",
  "cms.theme.enabled": "Tema desde tokens CMS",
  "cms.home_builder.enabled": "Home Builder (Fase 4)",
  "cms.matches.enabled": "Partidos en Supabase (Fase 1)",
  "cms.catalog.primary": "Catálogo Supabase primario",
  "cms.seo.enabled": "SEO y redirects (Fase 3)",
  "cms.cards.enabled": "Card Builder (Fase 6)",
  "cms.fantasy_config.enabled": "Reglas Fantasy (Fase 7)",
  "cms.predictions_config.enabled": "Scoring predicciones (Fase 7)",
  "cms.media.enabled": "Media DAM (Fase 8)",
  "cms.automation.enabled": "Automatización (Fase 10)",
};

export function StudioPlatformPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [cmsReady, setCmsReady] = useState(false);
  const [config, setConfig] = useState<ResolvedCmsConfig | null>(null);
  const [audit, setAudit] = useState<CmsAuditEntry[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/platform");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar plataforma");
      setCmsReady(Boolean(data.cmsReady));
      setConfig(data.config);
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

  async function saveFlags() {
    setSaving(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setMsg(data.message || "Flags guardados");
      setConfig(data.config);
      setFlags({ ...data.config.flags });
      setAudit((prev) => prev);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setSaving(false);
  }

  async function activateAll() {
    setSaving(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/activate-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg(data.message || "Módulos activados");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setSaving(false);
  }

  async function runSeedAll() {
    setSaving(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/seed-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en seed");
      setMsg(data.message || "Seed completo");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setSaving(false);
  }

  async function runSeed() {
    setSaving(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/seed-phase0", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en seed");
      setMsg(data.message || "Seed completado");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="bf-studio-panel-loading">Cargando plataforma CMS…</div>;
  }

  return (
    <div className="bf-studio-platform">
      {!cmsReady && (
        <div className="bf-studio-alert" role="alert">
          <Database size={18} />
          <div>
            <strong>Tablas CMS no detectadas</strong>
            <p>
              Ejecuta <code>supabase/APPLY_CMS_ALL.sql</code> (Fase 0 + 1–11) en Supabase SQL Editor, luego
              «Seed completo» o «Inicializar desde web actual».
            </p>
          </div>
        </div>
      )}

      <div className="bf-studio-toolbar">
        <button type="button" className="bp-btn bp-btn-ghost" onClick={load} disabled={saving}>
          <RefreshCw size={16} /> Actualizar
        </button>
        <button type="button" className="bp-btn bp-btn-ghost" onClick={runSeedAll} disabled={saving}>
          <Sparkles size={16} /> Seed completo (Fases 0–11)
        </button>
        <button type="button" className="bp-btn bp-btn-ghost" onClick={runSeed} disabled={saving}>
          Inicializar Fase 0
        </button>
        <button type="button" className="bp-btn bp-btn-gold" onClick={activateAll} disabled={saving}>
          Activar todo
        </button>
        <button type="button" className="bp-btn bp-btn-ghost" onClick={saveFlags} disabled={saving}>
          Guardar flags
        </button>
      </div>

      {msg && <div className={`bf-admin-toast ${error ? "is-error" : ""}`}>{msg}</div>}

      <section className="bf-studio-section">
        <h2>
          <Flag size={18} /> Feature flags (Strangler)
        </h2>
        <p className="bf-studio-hint">
          CMS en <strong>modo producción</strong>: flags activos por defecto con fallback legacy si falta data en
          Supabase.
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
                  <strong>{FLAG_LABELS[key] ?? key}</strong>
                  <code>{key}</code>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {config && (
          <p className="bf-studio-meta">
            Fuente resuelta: <code>{config.source}</code> · v{config.version}
          </p>
        )}
      </section>

      {config?.modules && config.modules.length > 0 && (
        <section className="bf-studio-section">
          <h2>Roadmap de módulos</h2>
          <div className="bf-studio-module-grid">
            {config.modules.map((m) => (
              <div key={m.id} className={`bf-studio-module-card is-${m.status}`}>
                <span className="bf-studio-module-phase">Fase {m.phase}</span>
                <strong>{m.label}</strong>
                <p>{m.description}</p>
                <span className="bf-studio-module-status">{m.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bf-studio-section">
        <h2>Auditoría reciente</h2>
        {audit.length === 0 ? (
          <p className="bf-studio-hint">Sin entradas aún. Los cambios en plataforma y catálogo se registrarán aquí.</p>
        ) : (
          <ul className="bf-studio-audit-list">
            {audit.map((a) => (
              <li key={a.id}>
                <span className="bf-studio-audit-action">{a.action}</span>
                <span className="bf-studio-audit-entity">
                  {a.entityType}
                  {a.entityId ? ` · ${a.entityId}` : ""}
                </span>
                <time dateTime={a.createdAt}>
                  {new Date(a.createdAt).toLocaleString("es-ES")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
