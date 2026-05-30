"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminField, AdminFieldRow } from "@/components/admin/AdminField";
import { slugifyAdminId } from "@/lib/data/admin-tournaments";

const REGIONS = ["GLOBAL", "EMEA", "EA", "NA", "SA", "CN"] as const;

type EntityKind = "team" | "player" | "tournament";

const DEFAULTS: Record<EntityKind, Record<string, unknown>> = {
  team: {
    name: "",
    tag: "",
    region: "GLOBAL",
    country: "",
    earnings: 0,
    rank: null,
    roster_slugs: [],
    circuit_status: "active",
    bsc_qualified_2026: true,
    achievements: [],
    social: {},
    meta: {},
  },
  player: {
    ign: "",
    real_name: "",
    team_slug: null,
    region: "GLOBAL",
    role: "Player",
    status: "active",
    fantasy_points: 70,
    fantasy_ownership: 20,
    rating: 1,
    social: {},
    meta: {},
  },
  tournament: {
    name: "",
    short_name: "",
    region: "GLOBAL",
    prize_pool: "",
    teams_count: 0,
    status: "upcoming",
    participant_slugs: [],
    meta: {},
  },
};

export function AdminEntityCreateDialog({
  kind,
  label,
  teams,
  onCreated,
  disabled,
}: {
  kind: EntityKind;
  label: string;
  teams?: { slug: string; name: string; tag: string }[];
  onCreated: (slug: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState("GLOBAL");
  const [teamSlug, setTeamSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function reset() {
    setSlugInput("");
    setName("");
    setTag("");
    setRegion("GLOBAL");
    setTeamSlug("");
    setErr("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugifyAdminId(slugInput || name);
    if (!slug) {
      setErr("Escribe un nombre o identificador");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const base = { ...DEFAULTS[kind], slug };
      if (kind === "team") {
        Object.assign(base, {
          name: name || slug,
          tag: tag || slug.slice(0, 3).toUpperCase(),
          region,
        });
      } else if (kind === "player") {
        Object.assign(base, {
          ign: name || slug,
          team_slug: teamSlug || null,
          region,
        });
      } else {
        Object.assign(base, {
          name: name || slug,
          short_name: tag || name || slug,
          region,
        });
      }
      const url =
        kind === "team"
          ? "/api/admin/teams"
          : kind === "player"
            ? "/api/admin/players"
            : "/api/admin/catalog";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "tournament" ? { entity: "tournament", row: base } : { row: base },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear");
      setOpen(false);
      reset();
      onCreated(slug);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Error");
    }
    setSaving(false);
  }

  return (
    <>
      <button
        type="button"
        className="bp-btn bp-btn-gold bf-admin-btn-new"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} /> {label}
      </button>
      {open && (
        <div className="bf-admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="bf-admin-modal" onSubmit={submit}>
            <div className="bf-admin-modal-head">
              <h3>{label}</h3>
              <button type="button" className="bf-admin-modal-close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="bf-admin-modal-body">
              <AdminField label="Nombre visible" hint="Se genera el ID automáticamente">
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </AdminField>
              <AdminField label="ID interno (slug)" hint="solo-letras-numeros — ej: mi-equipo-nuevo">
                <input
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder={name ? slugifyAdminId(name) : "mi-equipo"}
                />
              </AdminField>
              {kind === "team" && (
                <AdminFieldRow>
                  <AdminField label="Tag">
                    <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="TAG" />
                  </AdminField>
                  <AdminField label="Región">
                    <select value={region} onChange={(e) => setRegion(e.target.value)}>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                </AdminFieldRow>
              )}
              {kind === "player" && (
                <AdminFieldRow>
                  <AdminField label="Club">
                    <select value={teamSlug} onChange={(e) => setTeamSlug(e.target.value)}>
                      <option value="">— Sin equipo —</option>
                      {(teams ?? []).map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.tag} · {t.name}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Región">
                    <select value={region} onChange={(e) => setRegion(e.target.value)}>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                </AdminFieldRow>
              )}
              {kind === "tournament" && (
                <AdminField label="Región">
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </AdminField>
              )}
              {err && <p className="bf-admin-field-hint" style={{ color: "var(--bp-red-bright)" }}>{err}</p>}
            </div>
            <div className="bf-admin-modal-foot">
              <button type="button" className="bp-btn bp-btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="bp-btn bp-btn-gold" disabled={saving}>
                Crear y editar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
