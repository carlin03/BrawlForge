"use client";

import { useMemo, useState } from "react";
import { Image, Search, Wrench } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { AdminField } from "@/components/admin/AdminField";
import { TEAM_LOGO_TREATMENT, type LogoTreatment } from "@/lib/data/logo-branding";
import { bsc2026Tournaments } from "@/lib/data/bsc-tournaments";
import { getTeams2026 } from "@/lib/data/teams-2026";
import { notifyLogosUpdated, useRefreshLogos } from "@/contexts/LogoConfigContext";

const TREATMENTS: { id: LogoTreatment; label: string }[] = [
  { id: "strip-white", label: "Fondo blanco recortado" },
  { id: "border-only", label: "Solo borde" },
  { id: "mono-white", label: "Mono blanco" },
];

type LogoKind = "team" | "tournament";

export function AdminLogoPanel() {
  const [kind, setKind] = useState<LogoKind>("team");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("natus-vincere");
  const [treatment, setTreatment] = useState<LogoTreatment>("strip-white");
  const [imageUrl, setImageUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [savedPreviewUrl, setSavedPreviewUrl] = useState<string | null>(null);
  const refreshLogos = useRefreshLogos();

  const teams = useMemo(() => getTeams2026().sort((a, b) => a.name.localeCompare(b.name)), []);
  const tournaments = useMemo(
    () => [...bsc2026Tournaments].sort((a, b) => a.shortName.localeCompare(b.shortName)),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (kind === "team") {
      if (!q) return teams;
      return teams.filter(
        (t) =>
          t.slug.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          (t.tag ?? "").toLowerCase().includes(q),
      );
    }
    if (!q) return tournaments;
    return tournaments.filter(
      (t) =>
        t.slug.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q),
    );
  }, [teams, tournaments, search, kind]);

  const selectedTeam = kind === "team" ? teams.find((t) => t.slug === selected) : null;
  const selectedTour = kind === "tournament" ? tournaments.find((t) => t.slug === selected) : null;
  const displayName = selectedTeam?.name ?? selectedTour?.shortName ?? selected;

  async function saveOverride(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selected, treatment, imageUrl, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      if (data.logoUrl) setSavedPreviewUrl(String(data.logoUrl));
      setPreviewKey((k) => k + 1);
      await refreshLogos();
      notifyLogosUpdated({ cacheVersion: data.cacheVersion, logoUrl: data.logoUrl });
      const warn = Array.isArray(data.warnings) && data.warnings.length ? ` Avisos: ${data.warnings.join("; ")}` : "";
      setMsg((data.message || "Logo guardado.") + warn);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  }

  async function runScript(script: string) {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setPreviewKey((k) => k + 1);
      setMsg(data.message || "Proceso completado");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  }

  return (
    <div className="bf-admin-logos">
      <div className="bf-admin-logo-help" role="note">
        <strong>Logos en Vercel</strong>
        <p>
          No hay carpeta <code>public/logos/</code> en producción. Pega aquí la URL directa de cada PNG/JPG
          (Imgur, CDN, tu hosting) o usa los logos automáticos del circuito. En tu PC puedes generar PNG locales con{" "}
          <code>npm run logos:fetch</code>.
        </p>
      </div>
      <div className="bf-admin-logos-tabs">
        <button
          type="button"
          className={`bf-admin-logos-tab ${kind === "team" ? "is-on" : ""}`}
          onClick={() => {
            setKind("team");
            setSelected(teams[0]?.slug ?? "natus-vincere");
          }}
        >
          Equipos ({teams.length})
        </button>
        <button
          type="button"
          className={`bf-admin-logos-tab ${kind === "tournament" ? "is-on" : ""}`}
          onClick={() => {
            setKind("tournament");
            setSelected(tournaments[0]?.slug ?? "bsc-2026-psi-emea");
          }}
        >
          Torneos ({tournaments.length})
        </button>
      </div>

      {msg && <div className={`bf-admin-toast ${msg.includes("Error") ? "is-error" : ""}`}>{msg}</div>}

      <div className="bf-admin-logos-layout">
        <div className="bf-admin-sidebar" style={{ maxHeight: "none" }}>
          <div className="bf-admin-search-wrap" style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--bp-dim)" }} />
            <input
              className="bf-admin-search"
              style={{ paddingLeft: 40 }}
              placeholder={kind === "team" ? "Buscar club…" : "Buscar torneo…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bf-admin-logos-grid">
            {filtered.map((item) => {
              const slug = item.slug;
              const on = selected === slug;
              const title =
                kind === "team" && "tag" in item
                  ? `${item.tag} · ${item.name}`
                  : "shortName" in item
                    ? item.shortName
                    : item.slug;
              return (
                <button
                  key={slug}
                  type="button"
                  className={`bf-admin-logo-tile ${on ? "is-on" : ""}`}
                  onClick={() => setSelected(slug)}
                >
                  {kind === "team" ? (
                    <TeamLogo slug={slug} name={title} size={56} />
                  ) : (
                    <TournamentLogo slug={slug} name={title} size={56} />
                  )}
                  <span className="bf-admin-logo-tile-name">{title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bf-admin-logo-preview-panel">
          <h3 className="bf-admin-logo-preview-title">{displayName}</h3>
          <p className="bf-admin-logo-preview-sub">
            Así se verá en la web · selecciona otro logo solo si hace falta cambiarlo
          </p>

          <div className="bf-admin-logo-sizes" key={previewKey}>
            <div className="bf-admin-logo-size-label">
              {kind === "team" ? (
                <TeamLogo slug={selected} name={displayName} size={32} />
              ) : (
                <TournamentLogo slug={selected} name={displayName} size={32} />
              )}
              <span>Nav · 32px</span>
            </div>
            <div className="bf-admin-logo-size-label">
              {kind === "team" ? (
                <TeamLogo slug={selected} name={displayName} size={64} />
              ) : (
                <TournamentLogo slug={selected} name={displayName} size={64} />
              )}
              <span>Card · 64px</span>
            </div>
            <div className="bf-admin-logo-size-label">
              {kind === "team" ? (
                <TeamLogo slug={selected} name={displayName} size={96} />
              ) : (
                <TournamentLogo slug={selected} name={displayName} size={96} />
              )}
              <span>Hero · 96px</span>
            </div>
          </div>

          <form onSubmit={saveOverride}>
            {kind === "team" && (
              <AdminField
                label="Tratamiento del logo"
                hint="Cómo se procesa el PNG del club en fondos oscuros"
              >
                <select value={treatment} onChange={(e) => setTreatment(e.target.value as LogoTreatment)}>
                  {TREATMENTS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </AdminField>
            )}
            <AdminField
              label="URL de imagen nueva"
              hint={
                kind === "team"
                  ? "Obligatorio: enlace directo a PNG/JPG del logo del club"
                  : "URL del logo del torneo"
              }
            >
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </AdminField>
            <button type="submit" className="bp-btn bp-btn-gold" disabled={loading} style={{ width: "100%" }}>
              <Image size={16} /> Aplicar cambio a este logo
            </button>
          </form>

          <details className="bf-admin-tools-collapse">
            <summary>
              <Wrench size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Herramientas masivas
            </summary>
            <div className="bf-admin-tools-btns">
              <button type="button" className="bp-btn bp-btn-ghost" disabled={loading} onClick={() => runScript("brand")}>
                Reprocesar todos los equipos
              </button>
              <button type="button" className="bp-btn bp-btn-ghost" disabled={loading} onClick={() => runScript("tournaments")}>
                Reprocesar torneos BSC
              </button>
              <button type="button" className="bp-btn bp-btn-ghost" disabled={loading} onClick={() => runScript("bsc")}>
                Logo general BSC
              </button>
            </div>
            <p className="bf-admin-field-hint" style={{ marginTop: 12 }}>
              {Object.keys(TEAM_LOGO_TREATMENT).length} equipos con regla de marca especial.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
