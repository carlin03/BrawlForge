"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Image, Search } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { AdminField } from "@/components/admin/AdminField";
import {
  getAdminBscTeamsListFromRows,
  mergeAdminTeamRows,
  type AdminTeamCatalogRow,
} from "@/lib/data/admin-bsc-teams";
import { mergeAdminTournamentRows } from "@/lib/data/admin-tournaments";
import { notifyCatalogUpdated } from "@/contexts/CatalogContext";
import { notifyLogosUpdated, useLogoConfig, useRefreshLogos } from "@/contexts/LogoConfigContext";
import { normalizeAdminMediaUrl } from "@/lib/image-fetch-url";
import { CIRCUIT_TEAM_LOGO_FALLBACKS } from "@/lib/data/team-logo-urls";
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
  const tournamentFromQuery = searchParams.get("tournament")?.trim().toLowerCase() ?? "";

  const [kind, setKind] = useState<LogoKind>("team");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | Region>("all");
  const [selected, setSelected] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const refreshLogos = useRefreshLogos();
  const logoConfig = useLogoConfig();
  const logoCacheKey = logoConfig.cacheVersion ?? "0";

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

  const tournamentRows = useMemo(() => mergeAdminTournamentRows(null), []);
  const tournaments = useMemo(
    () =>
      tournamentRows.map((r) => ({
        slug: r.slug,
        name: r.name,
        shortName: r.short_name ?? r.name,
      })),
    [tournamentRows],
  );

  useEffect(() => {
    if (!teamFromQuery) return;
    if (teams.some((t) => t.slug === teamFromQuery)) {
      setKind("team");
      setSelected(teamFromQuery);
      setRegionFilter("all");
    }
  }, [teamFromQuery, teams]);

  useEffect(() => {
    if (!tournamentFromQuery) return;
    if (tournaments.some((t) => t.slug === tournamentFromQuery)) {
      setKind("tournament");
      setSelected(tournamentFromQuery);
    }
  }, [tournamentFromQuery, tournaments]);

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
    if (!selected) return;
    if (kind === "team") {
      const row = catalogRows.find((t) => t.slug === selected);
      setImageUrl(row?.logo_url ?? "");
      return;
    }
    const row = tournamentRows.find((t) => t.slug === selected);
    setImageUrl(row?.logo_url ?? "");
  }, [kind, selected, catalogRows, tournamentRows]);

  async function saveOverride(e?: React.FormEvent, forcedUrl?: string) {
    e?.preventDefault();
    setLoading(true);
    setMsg("");
    const raw = (forcedUrl ?? imageUrl).trim();
    if (forcedUrl) setImageUrl(forcedUrl);
    const normalized = normalizeAdminMediaUrl(raw);
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
      let activeNote = "";
      if (kind === "team") {
        try {
          const cfgRes = await fetch("/api/logos/config", { cache: "no-store" });
          const cfg = await cfgRes.json();
          const active = cfg?.overrides?.teams?.[selected]?.url;
          if (active) {
            const onStorage = String(active).includes("supabase.co/storage/");
            activeNote = ` URL activa: ${String(active).split("?")[0]}${onStorage ? " (Storage OK)" : " (externa — puede dar error en Vercel)"}`;
          }
        } catch {
          /* ignore */
        }
      }
      const hosted = data.hostedOnSupabase ? " Copiado a Supabase Storage." : "";
      setMsg((data.message || "Logo guardado.") + hosted + activeNote + warn);
      if (Array.isArray(data.warnings) && data.warnings.some((w: string) => w.includes("SERVICE_ROLE") || w.includes("Storage"))) {
        setMsg((prev) => `${prev} Revisa Vercel: SUPABASE_SERVICE_ROLE_KEY y bucket logos (npm run supabase:apply:storage).`);
      }
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
          {teams.length} clubes (BSC + Liquipedia) y {tournaments.length} torneos tier B+. Pega un enlace directo
          (PNG, JPG, SVG o WebP) y guarda: la web usará exactamente esa imagen.
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
          Torneos tier B+ ({tournaments.length})
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
              placeholder={kind === "team" ? "Buscar club…" : "Buscar torneo tier B+…"}
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
                    <TeamLogo key={`${slug}-${logoCacheKey}`} slug={slug} name={title} size={56} />
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
            {kind === "team" && CIRCUIT_TEAM_LOGO_FALLBACKS[selected] && (
              <button
                type="button"
                className="bp-btn"
                disabled={loading}
                style={{ width: "100%", marginTop: 8 }}
                onClick={() => void saveOverride(undefined, CIRCUIT_TEAM_LOGO_FALLBACKS[selected])}
              >
                Usar logo recomendado (Ninguém / Big Talents)
              </button>
            )}
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
