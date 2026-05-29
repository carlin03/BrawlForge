"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Image, Search, Wrench } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { AdminField } from "@/components/admin/AdminField";
import { TEAM_LOGO_TREATMENT, type LogoTreatment } from "@/lib/data/logo-branding";
import { getAdminBscTournaments } from "@/lib/data/bsc-tournaments";
import {
  BSC_2026_NEW_TEAM_SLUGS,
  getAdminBscTeamsList,
  isBsc2026NewTeam,
} from "@/lib/data/admin-bsc-teams";
import { notifyLogosUpdated, useRefreshLogos } from "@/contexts/LogoConfigContext";
import type { Region } from "@/lib/types";

const TREATMENTS: { id: LogoTreatment; label: string }[] = [
  { id: "strip-white", label: "Fondo blanco recortado" },
  { id: "border-only", label: "Solo borde" },
  { id: "mono-white", label: "Mono blanco" },
];

const REGION_FILTERS: { id: "all" | Region | "new"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Nuevos BSC" },
  { id: "EMEA", label: "EMEA" },
  { id: "EA", label: "EA" },
  { id: "NA", label: "NA" },
  { id: "SA", label: "SA" },
];

type LogoKind = "team" | "tournament";

const DEFAULT_TEAM_SLUG = BSC_2026_NEW_TEAM_SLUGS[0] ?? "madridmira";

export function AdminLogoPanel() {
  const searchParams = useSearchParams();
  const teamFromQuery = searchParams.get("team")?.trim().toLowerCase() ?? "";

  const [kind, setKind] = useState<LogoKind>("team");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | Region | "new">("all");
  const [selected, setSelected] = useState(DEFAULT_TEAM_SLUG);
  const [treatment, setTreatment] = useState<LogoTreatment>("strip-white");
  const [imageUrl, setImageUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const refreshLogos = useRefreshLogos();

  const teams = useMemo(() => getAdminBscTeamsList(), []);

  useEffect(() => {
    if (!teamFromQuery) return;
    if (teams.some((t) => t.slug === teamFromQuery)) {
      setKind("team");
      setSelected(teamFromQuery);
      setRegionFilter("all");
    }
  }, [teamFromQuery, teams]);

  const tournaments = useMemo(() => getAdminBscTournaments(), []);
  const newCount = teams.filter((t) => t.isNew).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (kind === "team") {
      let list = teams;
      if (regionFilter === "new") list = list.filter((t) => t.isNew);
      else if (regionFilter !== "all") list = list.filter((t) => t.region === regionFilter);
      if (!q) return list;
      return list.filter(
        (t) =>
          t.slug.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.tag.toLowerCase().includes(q),
      );
    }
    if (!q) return tournaments;
    return tournaments.filter(
      (t) =>
        t.slug.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q),
    );
  }, [teams, tournaments, search, kind, regionFilter]);

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

  async function fillSuggestedUrl() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/logos/suggest?slug=${encodeURIComponent(selected)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sin URL");
      setImageUrl(data.url);
      setMsg(`URL automática: ${data.url}`);
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
        <strong>Logos en producción (Vercel)</strong>
        <p>
          Lista completa del circuito BSC 2026 ({teams.length} clubes, {newCount} nuevos). No se sube{" "}
          <code>public/logos/</code> al deploy. Si un club no se ve bien, pulsa <strong>Usar URL automática</strong> o
          pega un enlace directo PNG/JPG y guarda (Supabase Storage).
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: "var(--bp-dim)" }}>
          Nuevos: {BSC_2026_NEW_TEAM_SLUGS.join(", ")} · <code>npm run supabase:apply:storage</code> si falla el
          guardado.
        </p>
      </div>
      <div className="bf-admin-logos-tabs">
        <button
          type="button"
          className={`bf-admin-logos-tab ${kind === "team" ? "is-on" : ""}`}
          onClick={() => {
            setKind("team");
            setSelected(DEFAULT_TEAM_SLUG);
            setRegionFilter("all");
          }}
        >
          Equipos BSC ({teams.length})
        </button>
        <button
          type="button"
          className={`bf-admin-logos-tab ${kind === "tournament" ? "is-on" : ""}`}
          onClick={() => {
            setKind("tournament");
            setSelected(tournaments[0]?.slug ?? "world-finals-2026");
          }}
        >
          Torneos ({tournaments.length})
        </button>
      </div>

      {msg && <div className={`bf-admin-toast ${msg.includes("Error") ? "is-error" : ""}`}>{msg}</div>}

      <div className="bf-admin-logos-layout">
        <div className="bf-admin-sidebar" style={{ maxHeight: "none" }}>
          {kind === "team" && (
            <div className="bf-admin-region-filters" role="group" aria-label="Filtrar por región">
              {REGION_FILTERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`bf-admin-region-chip ${regionFilter === r.id ? "is-on" : ""}`}
                  onClick={() => setRegionFilter(r.id)}
                >
                  {r.label}
                  {r.id === "new" ? ` (${newCount})` : ""}
                </button>
              ))}
            </div>
          )}
          <div className="bf-admin-search-wrap" style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--bp-dim)" }} />
            <input
              className="bf-admin-search"
              style={{ paddingLeft: 40 }}
              placeholder={kind === "team" ? "Buscar club BSC…" : "Buscar torneo…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bf-admin-logos-grid">
            {filtered.map((item) => {
              const slug = item.slug;
              const on = selected === slug;
              const isNewTeam = kind === "team" && isBsc2026NewTeam(slug);
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
                  className={`bf-admin-logo-tile ${on ? "is-on" : ""} ${isNewTeam ? "is-new-team" : ""}`}
                  onClick={() => setSelected(slug)}
                  title={isNewTeam ? `${title} · club nuevo BSC 2026` : title}
                >
                  {kind === "team" ? (
                    <TeamLogo slug={slug} name={title} size={56} />
                  ) : (
                    <TournamentLogo slug={slug} name={title} size={56} />
                  )}
                  <span className="bf-admin-logo-tile-name">
                    {isNewTeam && <span className="bf-admin-new-badge">Nuevo</span>}
                    {title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bf-admin-logo-preview-panel">
          <h3 className="bf-admin-logo-preview-title">
            {displayName}
            {selectedTeam?.isNew && (
              <span className="bf-admin-new-badge" style={{ marginLeft: 8, verticalAlign: "middle" }}>
                Nuevo BSC
              </span>
            )}
          </h3>
          <p className="bf-admin-logo-preview-sub">
            {selectedTeam
              ? `${selectedTeam.tag} · ${selectedTeam.region} · ${selected}`
              : "Así se verá en la web"}
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
                  ? "Opcional si ya se ve bien; si no, URL directa PNG/JPG o automática"
                  : "URL del logo del torneo"
              }
            >
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://cdn.royaleapi.com/… o Taiyoro / Wikimedia"
              />
            </AdminField>
            {kind === "team" && (
              <button
                type="button"
                className="bp-btn bp-btn-ghost"
                disabled={loading}
                style={{ width: "100%", marginBottom: 10 }}
                onClick={() => void fillSuggestedUrl()}
              >
                Usar URL automática (CDN)
              </button>
            )}
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
