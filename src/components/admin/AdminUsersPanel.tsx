"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Mail } from "lucide-react";
import { AdminField, AdminMeta } from "@/components/admin/AdminField";

type AdminUserRow = {
  id: string;
  email: string | null;
  displayName: string;
  ign: string | null;
  favoriteTeamSlug: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  lastPath: string | null;
  topPages: { path: string; hits: number }[];
  authCreatedAt: string | null;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  predictPoints: number;
  predictStreak: number;
  predictCorrect: number;
  predictAttempts: number;
  predictVotes: number;
  fantasyEntries: number;
  fantasyTournaments: string[];
  hasFantasySquad: boolean;
  fantasyUpdatedAt: string | null;
};

type Totals = {
  registered: number;
  withSquad: number;
  activeLast7d: number;
  predictVotes: number;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setSetupRequired(Boolean(data.setupRequired));
        throw new Error(data.error ?? "Error al cargar usuarios");
      }
      setUsers(data.users ?? []);
      setTotals(data.totals ?? null);
      if (data.users?.length && !selectedId) {
        setSelectedId(data.users[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setUsers([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.ign?.toLowerCase().includes(q) ?? false) ||
        u.id.includes(q),
    );
  }, [users, search]);

  const selected = filtered.find((u) => u.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="bf-admin-users">
      <div className="bf-admin-users-head">
        <div>
          <h2 className="bf-admin-section-title">Usuarios registrados</h2>
          <p className="bf-admin-meta">
            Cada cuenta aparece en el ranking fantasy. Aquí ves actividad, predicciones y páginas más visitadas.
          </p>
        </div>
        <button type="button" className="bp-btn bp-btn-ghost" onClick={() => void load()} disabled={loading}>
          Actualizar
        </button>
      </div>

      {setupRequired && (
        <p className="bf-admin-toast is-warn">
          Añade <code>SUPABASE_SERVICE_ROLE_KEY</code> en Vercel (.env) para ver emails y datos de Auth.
        </p>
      )}

      {error && <p className="bf-admin-toast is-error">{error}</p>}

      {totals && (
        <div className="bf-admin-users-stats">
          <div>
            <b>{totals.registered}</b>
            <span>Registrados</span>
          </div>
          <div>
            <b>{totals.withSquad}</b>
            <span>Con plantilla fantasy</span>
          </div>
          <div>
            <b>{totals.activeLast7d}</b>
            <span>Activos 7 días</span>
          </div>
          <div>
            <b>{totals.predictVotes}</b>
            <span>Votos predicción</span>
          </div>
        </div>
      )}

      {loading ? (
        <p className="adm-meta">Cargando usuarios…</p>
      ) : (
        <div className="adm-users-grid">
          <aside className="adm-users-list">
            <AdminField label="Buscar">
              <div className="adm-search-wrap">
                <Search size={16} aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre, email, ID…"
                />
              </div>
            </AdminField>
            <div className="bf-admin-users-scroll">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`bf-admin-users-row ${selected?.id === u.id ? "is-on" : ""}`}
                  onClick={() => setSelectedId(u.id)}
                >
                  <span className="bf-admin-users-row-name">{u.displayName}</span>
                  <span className="bf-admin-users-row-sub">
                    {u.email ?? u.id.slice(0, 8)}
                    {u.isAdmin ? " · Admin" : ""}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && <p className="adm-meta">Sin resultados</p>}
            </div>
          </aside>

          {selected && (
            <section className="adm-users-detail">
              <h3>{selected.displayName}</h3>
              <AdminMeta>
                <Mail size={14} /> {selected.email ?? "Sin email (service role)"}
              </AdminMeta>

              <div className="bf-admin-users-detail-grid">
                <div>
                  <h4>Cuenta</h4>
                  <dl className="bf-admin-dl">
                    <dt>ID</dt>
                    <dd className="bf-admin-mono">{selected.id}</dd>
                    <dt>IGN</dt>
                    <dd>{selected.ign ?? "—"}</dd>
                    <dt>Registro (perfil)</dt>
                    <dd>{fmtDate(selected.createdAt)}</dd>
                    <dt>Registro (Auth)</dt>
                    <dd>{fmtDate(selected.authCreatedAt)}</dd>
                    <dt>Último login</dt>
                    <dd>{fmtDate(selected.lastSignInAt)}</dd>
                    <dt>Email confirmado</dt>
                    <dd>{selected.emailConfirmed ? "Sí" : "No"}</dd>
                    <dt>Club favorito</dt>
                    <dd>{selected.favoriteTeamSlug ?? "—"}</dd>
                  </dl>
                </div>

                <div>
                  <h4>Actividad en la web</h4>
                  <dl>
                    <dt>Última visita</dt>
                    <dd>{fmtDate(selected.lastSeenAt)}</dd>
                    <dt>Última página</dt>
                    <dd>{selected.lastPath ?? "—"}</dd>
                    <dt>Perfil actualizado</dt>
                    <dd>{fmtDate(selected.updatedAt)}</dd>
                  </dl>
                  {selected.topPages.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 12 }}>Páginas con más visitas</h4>
                      <ul className="bf-admin-users-pages">
                        {selected.topPages.map((p) => (
                          <li key={p.path}>
                            <code>{p.path}</code>
                            <span>{p.hits} visitas</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div>
                  <h4>Fantasy</h4>
                  <dl className="bf-admin-dl">
                    <dt>Entradas torneo</dt>
                    <dd>{selected.fantasyEntries}</dd>
                    <dt>Plantilla guardada</dt>
                    <dd>{selected.hasFantasySquad ? "Sí" : "No"}</dd>
                    <dt>Último cambio fantasy</dt>
                    <dd>{fmtDate(selected.fantasyUpdatedAt)}</dd>
                  </dl>
                  {selected.fantasyTournaments.length > 0 && (
                    <p className="bf-admin-meta" style={{ marginTop: 8 }}>
                      Torneos: {selected.fantasyTournaments.join(", ")}
                    </p>
                  )}
                </div>

                <div>
                  <h4>Predicciones</h4>
                  <dl className="bf-admin-dl">
                    <dt>Votos emitidos</dt>
                    <dd>{selected.predictVotes}</dd>
                    <dt>Puntos</dt>
                    <dd>{selected.predictPoints}</dd>
                    <dt>Aciertos</dt>
                    <dd>
                      {selected.predictCorrect}/{selected.predictAttempts}
                    </dd>
                    <dt>Mejor racha</dt>
                    <dd>{selected.predictStreak}</dd>
                  </dl>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
