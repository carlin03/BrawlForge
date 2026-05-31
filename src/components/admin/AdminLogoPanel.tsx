"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Image, Search } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { AdminField } from "@/components/admin/AdminField";
import { getAdminBscTournaments } from "@/lib/data/bsc-tournaments";
import {
  getAdminBscTeamsListFromRows,
  mergeAdminTeamRows,
  type AdminTeamCatalogRow,
} from "@/lib/data/admin-bsc-teams";
import { notifyCatalogUpdated } from "@/contexts/CatalogContext";
import { notifyLogosUpdated, useRefreshLogos } from "@/contexts/LogoConfigContext";
import { normalizeAdminMediaUrl } from "@/lib/image-fetch-url";
import type { Region } from "@/lib/types";

const REGION_FILTERS: { id: "all" | Region; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "EMEA", label: "EMEA" },
  { id: "EA", label: "EA" },
  { id: "NA", label: "NA" },
  { id: "SA", label: "SA" },
];

type LogoKind = "team" | "tournament";

type AdminLogoPanelProps = {
  /** Si viene del AdminConsole, evita lista fija de 50 y muestra el catálogo fusionado. */
  catalogTeams?: AdminTeamCatalogRow[];
};

export function AdminLogoPanel({ catalogTeams }: AdminLogoPanelProps) {
  const searchParams = useSearchParams();
  const teamFromQuery = searchParams.get("team")?.trim().toLowerCase() ?? "";

  const [kind, setKind] = useState<LogoKind>("team");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | Region>("all");
  const [selected, setSelected] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const refreshLogos = useRefreshLogos();

  const [fetchedTeams, setFetchedTeams] = useState<AdminTeamCatalogRow[] | null>(null);

  useEffect(() => {
    if (catalogTeams?.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/teams");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setFetchedTeams(mergeAdminTeamRows(Array.isArray(data.teams) ? data.teams : null));
        }
      } catch {
        /* fallback local */
      }
    })();
    const onUpdate = () => {
      void (async () => {
        try {
          const res = await fetch("/api/admin/teams");
          const data = await res.json();
          if (!cancelled && res.ok) {
            setFetchedTeams(mergeAdminTeamRows(Array.isArray(data.teams) ? data.teams : null));
          }
        } catch {
          /* ignore */
        }
      })();
    };
    window.addEventListener("bf-catalog-updated", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("bf-catalog-updated", onUpdate);
    };
  }, [catalogTeams?.length]);

  const teams = useMemo(
    () => getAdminBscTeamsListFromRows(catalogTeams ?? fetchedTeams ?? undefined),
    [catalogTeams, fetchedTeams],
  );

  useEffect(() => {
    if (!selected && teams[0]?.slug) setSelected(teams[0].slug);
  }, [selected, teams]);

  useEffect(() => {
    if (!teamFromQuery) return;
    if (teams.some((t) => t.slug === teamFromQuery)) {
      setKind("team");
      setSelected(teamFromQuery);
      setRegionFilter("all");
    }
  }, [teamFromQuery, teams]);

  const tournaments = useMemo(() => getAdminBscTournaments(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (kind === "team") {
      let list = teams;
      if (regionFilter !== "all") list = list.filter((t) => t.region === regionFilter);
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

  const catalogRows = catalogTeams ?? fetchedTeams ?? [];
  const selectedTeam = kind === "team" ? teams.find((t) => t.slug === selected) : null;
  const selectedTour = kind === "tournament" ? tournaments.find((t) => t.slug === selected) : null;
  const displayName = selectedTeam?.name ?? selectedTour?.shortName ?? selected;

  useEffect(() => {
    if (kind !== "team" || !selected) return;
    const row = catalogRows.find((t) => t.slug === selected);
    setImageUrl(row?.logo_url ?? "");
  }, [kind, selected, catalogRows]);

  async function saveOverride(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setMsg("");
    const normalized = normalizeAdminMediaUrl(imageUrl);
    if (!normalized) {
      setMsg("URL no válida. Pega un enlace https://… (también vale sin https:// al inicio).");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selected, imageUrl: normalized, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setPreviewKey(Number(data.cacheVersion) || Date.now());
      if (data.logoUrl) setImageUrl(String(data.logoUrl).split("?")[0]);
      await refreshLogos();
      notifyLogosUpdated({
        cacheVersion: data.cacheVersion,
        logoUrl: data.logoUrl,
        slug: selected,
        kind,
      });
      notifyCatalogUpdated();
      const warn = Array.isArray(data.warnings) && data.warnings.length ? ` Avisos: ${data.warnings.join("; ")}` : "";
      setMsg((data.message || "Logo guardado.") + warn);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  }

  return (
    <div className="bf-admin-logos">
      <div className="bf-admin-logo-help" role="note">
        <strong>Logos por URL</strong>
        <p>
          {teams.length} clubes y {tournaments.length} torneos BSC. Pega un enlace directo (PNG, JPG, SVG o WebP) y
          guarda: la web usará exactamente esa imagen, sin recortar fondos ni filtros.
        </p>
      </div>
      <div className="bf-admin-logos-tabs">
        <button
          type="button"
          className={`bf-admin-logos-tab ${kind === "team" ? "is-on" : ""}`}
          onClick={() => {
            setKind("team");
            setSelected(teams[0]?.slug ?? "");
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

      {msg && (
        <div
          className={`bf-admin-toast ${msg.includes("Error") || msg.includes("no válida") ? "is-error" : ""}`}
        >
          {msg}
        </div>
      )}

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
                  title={title}
                >
                  {kind === "team" ? (
                    <TeamLogo key={slug} slug={slug} name={title} size={56} />
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
            {selectedTeam
              ? `${selectedTeam.tag} · ${selectedTeam.region} · ${selected}`
              : `${selected} · vista previa en la web`}
          </p>

          <div className="bf-admin-logo-sizes" key={previewKey}>
            <div className="bf-admin-logo-size-label">
              {kind === "team" ? (
                <TeamLogo key={`${selected}-32`} slug={selected} name={displayName} size={32} />
              ) : (
                <TournamentLogo slug={selected} name={displayName} size={32} />
              )}
              <span>Nav · 32px</span>
            </div>
            <div className="bf-admin-logo-size-label">
              {kind === "team" ? (
                <TeamLogo key={`${selected}-64`} slug={selected} name={displayName} size={64} />
              ) : (
                <TournamentLogo slug={selected} name={displayName} size={64} />
              )}
              <span>Card · 64px</span>
            </div>
            <div className="bf-admin-logo-size-label">
              {kind === "team" ? (
                <TeamLogo key={`${selected}-96`} slug={selected} name={displayName} size={96} />
              ) : (
                <TournamentLogo slug={selected} name={displayName} size={96} />
              )}
              <span>Hero · 96px</span>
            </div>
          </div>

          <form onSubmit={saveOverride}>
            <AdminField
              label="URL de imagen"
              hint="Cualquier CDN o enlace directo (PNG, JPG, SVG, WebP). Puedes pegar sin https://"
            >
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://… o cdn.ejemplo.com/logo.png"
              />
            </AdminField>
            <button type="submit" className="bp-btn bp-btn-gold" disabled={loading} style={{ width: "100%" }}>
              <Image size={16} /> Guardar URL del logo
            </button>
          </form>
          <div className="bf-admin-editor-footer">
            <button
              type="button"
              className="bp-btn bp-btn-gold"
              disabled={loading || !selected}
              style={{ width: "100%" }}
              onClick={() => void saveOverride()}
            >
              <Image size={16} /> Guardar URL del logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
