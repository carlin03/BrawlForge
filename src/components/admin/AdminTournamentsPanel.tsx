"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { AdminField, AdminFieldRow, AdminMeta } from "@/components/admin/AdminField";
import { AdminEntityCreateDialog } from "@/components/admin/AdminEntityCreateDialog";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import type { AdminTournamentRow } from "@/lib/data/admin-tournaments";
import { mergeAdminTournamentRows } from "@/lib/data/admin-tournaments";
import { mergeAdminTeamRows } from "@/lib/data/admin-bsc-teams";

const REGIONS = ["GLOBAL", "EMEA", "EA", "NA", "SA", "CN"] as const;
const STATUSES = [
  { id: "upcoming", label: "Próximo" },
  { id: "live", label: "En vivo" },
  { id: "finished", label: "Finalizado" },
] as const;

type Props = {
  teams: { slug: string; name: string; tag: string }[];
  embedded?: boolean;
};

export function AdminTournamentsPanel({ teams: teamsProp, embedded }: Props) {
  const [teamList, setTeamList] = useState(teamsProp);
  const [list, setList] = useState<AdminTournamentRow[]>([]);
  const [selected, setSelected] = useState<AdminTournamentRow | null>(null);
  const [search, setSearch] = useState("");
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
    fetch("/api/admin/catalog?type=teams")
      .then((r) => r.json())
      .then((data) => {
        const merged = mergeAdminTeamRows(data.teams ?? null);
        setTeamList(merged.map((t) => ({ slug: t.slug, name: t.name, tag: t.tag })));
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

  const filtered = list.filter(
    (t) =>
      !search ||
      t.slug.includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const participantSet = new Set(selected?.participant_slugs ?? []);

  return (
    <div className={embedded ? "" : "bf-admin-page"}>
      {!embedded && (
        <header className="bf-admin-hero" style={{ marginBottom: 20 }}>
          <h1 className="bf-admin-hero-title">Torneos</h1>
          <p className="bf-admin-hero-lead">Crea torneos, participantes, fechas y premios.</p>
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
          <input
            className="bf-admin-search"
            placeholder="Buscar torneo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {selected ? (
          <form
            className="bf-admin-editor"
            onSubmit={(e) => {
              e.preventDefault();
              save(selected);
            }}
          >
            <div className="bf-admin-editor-head">
              <TournamentLogo slug={selected.slug} name={selected.name} size={72} />
              <div>
                <h2>{selected.name}</h2>
                <p className="bf-admin-field-hint" style={{ margin: 0 }}>
                  {selected.slug}
                </p>
              </div>
            </div>

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

            <AdminField label="Liquipedia">
              <input
                value={selected.liquipedia_page ?? ""}
                onChange={(e) => setSelected({ ...selected, liquipedia_page: e.target.value })}
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

            <AdminField label="Participantes (equipos)" hint="Marca los clubes inscritos">
              <div className="bf-admin-roster-picker bf-admin-tournament-teams">
                {teamList
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <label key={t.slug}>
                      <input
                        type="checkbox"
                        checked={participantSet.has(t.slug)}
                        onChange={(e) => {
                          const next = new Set(selected.participant_slugs);
                          if (e.target.checked) next.add(t.slug);
                          else next.delete(t.slug);
                          setSelected({
                            ...selected,
                            participant_slugs: [...next],
                            teams_count: next.size,
                          });
                        }}
                      />
                      <span>
                        {t.tag} · {t.name}
                      </span>
                    </label>
                  ))}
              </div>
            </AdminField>

            <AdminMeta>
              Página: /tournaments/{selected.slug} · {selected.participant_slugs.length} participantes
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
