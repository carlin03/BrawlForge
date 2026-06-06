"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { AdminField, AdminFieldRow, AdminMeta } from "@/components/admin/AdminField";
import { AdminEntityCreateDialog } from "@/components/admin/AdminEntityCreateDialog";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import type { AdminTournamentRow } from "@/lib/data/admin-tournaments";
import {
  getAdminTournamentSource,
  isLiquipediaDiscoveredTournament,
  mergeAdminTournamentRows,
} from "@/lib/data/admin-tournaments";
import { mergeAdminTeamRows } from "@/lib/data/admin-bsc-teams";
import { AdminTeamLogoPicker } from "@/components/admin/AdminTeamLogoPicker";
import { AdminTournamentWebPreview } from "@/components/admin/AdminTournamentWebPreview";

const REGIONS = ["GLOBAL", "EMEA", "EA", "NA", "SA", "CN"] as const;
const STATUSES = [
  { id: "upcoming", label: "Próximo" },
  { id: "live", label: "En vivo" },
  { id: "finished", label: "Finalizado" },
] as const;

type SourceFilter = "all" | "bsc" | "liquipedia" | "discovered";

type Props = {
  teams: { slug: string; name: string; tag: string; region?: string }[];
  embedded?: boolean;
};

export function AdminTournamentsPanel({ teams: teamsProp, embedded }: Props) {
  const [teamList, setTeamList] = useState(teamsProp);
  const [list, setList] = useState<AdminTournamentRow[]>([]);
  const [selected, setSelected] = useState<AdminTournamentRow | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog?type=tournaments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setList(mergeAdminTournamentRows(data.tournaments ?? null));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (teamsProp.length) {
      setTeamList(teamsProp);
      return;
    }
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((data) => {
        const merged = mergeAdminTeamRows(data.teams ?? null);
        setTeamList(
          merged.map((t) => ({
            slug: t.slug,
            name: t.name,
            tag: t.tag,
            region: t.region,
          })),
        );
      })
      .catch(() => {});
  }, [teamsProp]);

  async function save(row: AdminTournamentRow) {
    setLoading(true);
    setMsg("");
    setMsgError(false);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "tournament", row }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg(data.message || "Guardado");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }

  async function remove(slug: string) {
    if (!confirm(`¿Eliminar torneo "${slug}" del catálogo?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/catalog?entity=tournament&slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSelected(null);
      setMsg(data.message || "Eliminado");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setMsgError(true);
    }
    setLoading(false);
  }

  const filtered = list.filter((t) => {
    const src = getAdminTournamentSource(t);
    if (sourceFilter === "bsc" && src !== "bsc") return false;
    if (sourceFilter === "liquipedia" && src !== "liquipedia") return false;
    if (sourceFilter === "discovered" && src !== "liquipedia-discovered") return false;
    if (
      search &&
      !t.slug.includes(search.toLowerCase()) &&
      !t.name.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const discoveredCount = list.filter((t) => isLiquipediaDiscoveredTournament(t.slug)).length;


  return (
    <div className={embedded ? "" : "bf-admin-page"}>
      {!embedded && (
        <header className="bf-admin-hero" style={{ marginBottom: 20 }}>
          <h1 className="bf-admin-hero-title">Torneos</h1>
          <p className="bf-admin-hero-lead">
            BSC curado + tier B+ Liquipedia ({list.length} eventos, {discoveredCount} auto-descubiertos).
          </p>
        </header>
      )}
      {msg && <div className={`bf-admin-toast ${msgError ? "is-error" : ""}`}>{msg}</div>}

      <div className="bf-admin-split">
        <aside className="bf-admin-sidebar">
          <AdminEntityCreateDialog
            kind="tournament"
            label="Nuevo torneo"
            onCreated={async (slug) => {
              const res = await fetch("/api/admin/catalog?type=tournaments");
              const data = await res.json();
              const merged = mergeAdminTournamentRows(data.tournaments ?? null);
              setList(merged);
              const row = merged.find((t) => t.slug === slug);
              if (row) setSelected({ ...row });
            }}
            disabled={loading}
          />
          <div className="bf-admin-region-filters" role="group" aria-label="Filtrar torneos">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "bsc", label: "BSC" },
                { id: "liquipedia", label: "Liquipedia" },
                { id: "discovered", label: `Nuevos (${discoveredCount})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                className={`bf-admin-region-chip ${sourceFilter === f.id ? "is-on" : ""}`}
                onClick={() => setSourceFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className="bf-admin-search"
            placeholder="Buscar torneo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <p className="bf-admin-field-hint" style={{ margin: "0 0 8px" }}>
            {filtered.length} de {list.length} torneos
          </p>
          <ul className="bf-admin-list-scroll">
            {filtered.map((t) => (
              <li key={t.slug} className="bf-admin-list-item">
                <button
                  type="button"
                  className={`bf-admin-list-card ${selected?.slug === t.slug ? "is-on" : ""}`}
                  onClick={() => setSelected({ ...t })}
                >
                  <TournamentLogo slug={t.slug} name={t.short_name ?? t.name} size={44} />
                  <span className="bf-admin-list-card-body">
                    <span className="bf-admin-list-card-title">{t.short_name || t.name}</span>
                    <span className="bf-admin-list-card-sub">{t.region} · {t.status}</span>
                    <span className="bf-admin-list-card-meta">
                      {t.participant_slugs.length} equipos
                      {getAdminTournamentSource(t) === "liquipedia-discovered" ? " · LP nuevo" : ""}
                      {t.meta?.saved_in_catalog ? " · guardado" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {selected ? (
          <form
            key={selected.slug}
            className="bf-admin-editor"
            onSubmit={(e) => {
              e.preventDefault();
              save(selected);
            }}
          >
            <div className="bf-admin-editor-head" key={`head-${selected.slug}`}>
              <TournamentLogo key={selected.slug} slug={selected.slug} name={selected.name} size={72} />
              <div>
                <h2>{selected.name}</h2>
                <p className="bf-admin-field-hint" style={{ margin: 0 }}>
                  {selected.slug}
                </p>
              </div>
            </div>

            <AdminTournamentWebPreview row={selected} teams={teamList} />

            <AdminFieldRow>
              <AdminField label="Nombre completo">
                <input
                  value={selected.name}
                  onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                />
              </AdminField>
              <AdminField label="Nombre corto">
                <input
                  value={selected.short_name ?? ""}
                  onChange={(e) => setSelected({ ...selected, short_name: e.target.value })}
                />
              </AdminField>
            </AdminFieldRow>

            <AdminFieldRow>
              <AdminField label="Región">
                <select
                  value={selected.region}
                  onChange={(e) => setSelected({ ...selected, region: e.target.value })}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Estado">
                <select
                  value={selected.status}
                  onChange={(e) => setSelected({ ...selected, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </AdminField>
            </AdminFieldRow>

            <AdminFieldRow>
              <AdminField label="Premio">
                <input
                  value={selected.prize_pool ?? ""}
                  onChange={(e) => setSelected({ ...selected, prize_pool: e.target.value })}
                  placeholder="$500,000"
                />
              </AdminField>
              <AdminField label="Tier (1-3)">
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={selected.tier ?? ""}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      tier: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </AdminField>
            </AdminFieldRow>

            <AdminFieldRow>
              <AdminField label="Fecha inicio">
                <input
                  value={selected.start_date ?? ""}
                  onChange={(e) => setSelected({ ...selected, start_date: e.target.value })}
                  placeholder="2026-06-01"
                />
              </AdminField>
              <AdminField label="Fecha fin">
                <input
                  value={selected.end_date ?? ""}
                  onChange={(e) => setSelected({ ...selected, end_date: e.target.value })}
                />
              </AdminField>
            </AdminFieldRow>

            <AdminFieldRow>
              <AdminField label="Ubicación">
                <input
                  value={selected.location ?? ""}
                  onChange={(e) => setSelected({ ...selected, location: e.target.value })}
                />
              </AdminField>
              <AdminField label="Fase / stage">
                <input
                  value={selected.stage ?? ""}
                  onChange={(e) => setSelected({ ...selected, stage: e.target.value })}
                />
              </AdminField>
            </AdminFieldRow>

            <AdminField label="URL logo del torneo">
              <input
                value={selected.logo_url ?? ""}
                onChange={(e) => setSelected({ ...selected, logo_url: e.target.value })}
                placeholder="https://…"
              />
            </AdminField>

            <AdminField label="Descripción / notas" hint="Texto libre guardado en metadatos">
              <textarea
                rows={3}
                value={String(selected.meta?.description ?? "")}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    meta: { ...selected.meta, description: e.target.value },
                  })
                }
              />
            </AdminField>

            <AdminField label="Participantes (equipos)" hint="Misma vista que Logos: clic en el escudo para inscribir o quitar">
              <AdminTeamLogoPicker
                teams={teamList.map((t) => ({
                  slug: t.slug,
                  name: t.name,
                  tag: t.tag,
                  region: t.region,
                }))}
                multiple
                selected={selected.participant_slugs}
                onChange={(slugs) =>
                  setSelected({
                    ...selected,
                    participant_slugs: slugs,
                    teams_count: slugs.length,
                  })
                }
                maxHeight="360px"
              />
            </AdminField>

            <AdminMeta>
              Página: /tournaments/{selected.slug} · {selected.participant_slugs.length} participantes ·{" "}
              <Link
                href={`/admin?tab=logos&tournament=${encodeURIComponent(selected.slug)}`}
                className="bf-home-link"
              >
                Editar logo
              </Link>{" "}
              ·{" "}
              <Link href="/admin?module=cards" className="bf-home-link">
                Colores de tarjetas
              </Link>
            </AdminMeta>

            <div className="bf-admin-editor-actions">
              <button type="submit" className="bp-btn bp-btn-gold" disabled={loading}>
                <Save size={16} /> Guardar torneo
              </button>
              <Link href={`/tournaments/${selected.slug}`} className="bp-btn bp-btn-ghost" target="_blank">
                Ver en la web
              </Link>
              <button
                type="button"
                className="bp-btn bp-btn-ghost"
                style={{ color: "var(--bp-red-bright)" }}
                onClick={() => remove(selected.slug)}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </form>
        ) : (
          <div className="bf-admin-empty-editor">Selecciona o crea un torneo</div>
        )}
      </div>
    </div>
  );
}
