"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function StudioToast({ message, error }: { message: string; error?: boolean }) {
  if (!message) return null;
  return (
    <div className={`bf-studio-toast ${error ? "is-error" : "is-ok"}`} role="status">
      {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{message}</span>
    </div>
  );
}

export function StudioPanel({
  title,
  lead,
  children,
  actions,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="bf-studio-panel">
      <div className="bf-studio-panel-head">
        <div>
          <h2>{title}</h2>
          {lead && <p className="bf-studio-lead">{lead}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function StudioField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="bf-studio-field">
      <span className="bf-studio-field-label">{label}</span>
      {hint && <span className="bf-studio-field-hint">{hint}</span>}
      {children}
    </label>
  );
}

export function StudioInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="bf-studio-input" {...props} />;
}

export function StudioSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="bf-studio-input" {...props} />;
}

export function StudioTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="bf-studio-input bf-studio-textarea" rows={3} {...props} />;
}

export function StudioColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bf-studio-color-picker">
      <span className="bf-studio-field-label">{label}</span>
      <div className="bf-studio-color-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <StudioInput value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export function StudioStat({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" }) {
  return (
    <div className={`bf-studio-stat ${tone ? `is-${tone}` : ""}`}>
      <span className="bf-studio-stat-value">{value}</span>
      <span className="bf-studio-stat-label">{label}</span>
    </div>
  );
}

export function StudioCard({
  title,
  children,
  footer,
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bf-studio-card">
      {title && <h3 className="bf-studio-card-title">{title}</h3>}
      <div className="bf-studio-card-body">{children}</div>
      {footer && <div className="bf-studio-card-foot">{footer}</div>}
    </div>
  );
}

export function StudioEmpty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="bf-studio-empty">
      <p className="bf-studio-empty-title">{title}</p>
      {children && <div className="bf-studio-empty-body">{children}</div>}
    </div>
  );
}

export function StudioLoading({ text = "Cargando…" }: { text?: string }) {
  return (
    <p className="bf-studio-loading">
      <Loader2 size={18} className="bf-studio-spin" /> {text}
    </p>
  );
}

export function StudioPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="bf-studio-pills" role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`bf-studio-pill ${value === o.id ? "is-on" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Sección técnica oculta por defecto — solo soporte / desarrolladores */
export function StudioAdvanced({ title = "Opciones técnicas", children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bf-studio-advanced">
      <button type="button" className="bf-studio-advanced-toggle" onClick={() => setOpen(!open)}>
        <ChevronDown size={16} className={open ? "is-open" : ""} />
        {title}
        <span className="bf-studio-advanced-note">No necesitas abrir esto para el día a día</span>
      </button>
      {open && <div className="bf-studio-advanced-body">{children}</div>}
    </div>
  );
}

const AUDIT_LABELS: Record<string, string> = {
  "catalog.upsert": "Actualizó el catálogo",
  "seed.phase0": "Sincronizó la configuración inicial",
  "seed.all": "Importó datos desde la web",
  "cms.activate_all": "Activó todos los módulos",
  "match.upsert": "Guardó un partido",
  "match.delete": "Eliminó un partido",
  "theme.update": "Cambió los colores del sitio",
  "seo.update": "Actualizó SEO",
  "home.curated": "Ajustó la página de inicio",
  "fantasy.ruleset": "Cambió reglas Fantasy",
  "predictions.scoring": "Cambió puntos de predicciones",
  "media.create": "Añadió una imagen",
  "card.template": "Editó una plantilla de tarjeta",
  "automation.rule": "Editó una automatización",
};

export function humanizeAudit(action: string, entityType: string, entityId: string | null): string {
  const base = AUDIT_LABELS[action] ?? "Hizo un cambio en la plataforma";
  if (entityId) return `${base} (${entityId})`;
  return base;
}

export const MATCH_STATUS_OPTIONS = [
  { id: "upcoming" as const, label: "Próximo" },
  { id: "live" as const, label: "En vivo" },
  { id: "finished" as const, label: "Finalizado" },
  { id: "cancelled" as const, label: "Cancelado" },
];

export const BLOCK_LABELS: Record<string, string> = {
  hero: "Cabecera principal",
  clubs_marquee: "Carrusel de clubes",
  matches_strip: "Lista de partidos",
  vote_strip: "Votaciones",
  news: "Noticias",
  tournaments: "Torneos",
  fantasy_teaser: "Fantasy",
  rankings_teaser: "Rankings",
  custom_json: "Bloque personalizado",
};
