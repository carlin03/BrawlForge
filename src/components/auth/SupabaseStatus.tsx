"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  auth: boolean;
  profilesTable: boolean;
  profilesError?: string | null;
  projectRef?: string;
  message: string;
};

export function SupabaseStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supabase/status")
      .then((r) => r.json())
      .then((data: Status) => setStatus(data))
      .catch(() =>
        setStatus({
          connected: false,
          auth: false,
          profilesTable: false,
          message: "No se pudo comprobar la conexión.",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="bf-supabase-status is-loading">Comprobando Supabase…</p>;
  }
  if (!status) return null;

  const ok = status.connected && status.profilesTable;
  const cls = ok ? "is-ok" : status.connected ? "is-warn" : "is-error";

  return (
    <div className={`bf-supabase-status ${cls}`}>
      <p className="bf-supabase-status-title">
        {ok ? "Supabase conectado" : status.connected ? "Conectado — falta configurar la base" : "Sin conexión a Supabase"}
      </p>
      <p className="bf-supabase-status-msg">{status.message}</p>
      {status.projectRef && (
        <p className="bf-supabase-status-ref">
          Proyecto: <code>{status.projectRef}</code> — comprueba que es el mismo en el dashboard.
        </p>
      )}
      {!status.profilesTable && status.connected && (
        <ol className="bf-supabase-status-steps">
          <li>
            Abre{" "}
            <a
              href={`https://supabase.com/dashboard/project/${status.projectRef}/sql/new`}
              target="_blank"
              rel="noopener noreferrer"
            >
              SQL Editor
            </a>{" "}
            en ese proyecto.
          </li>
          <li>
            Pega y ejecuta{" "}
            <code>20260528000000_initial.sql</code> y luego{" "}
            <code>20260529100000_game_data.sql</code> (fantasy + votos)
          </li>
          <li>
            Los usuarios registrados están en <strong>Authentication → Users</strong>, no en Table Editor
            hasta que exista la tabla <code>profiles</code>.
          </li>
          <li>
            Si ya tenías cuenta antes del SQL, ejecuta también{" "}
            <code>supabase/migrations/20260528100000_backfill_profiles.sql</code> o vuelve a entrar en la
            app (crea tu fila automáticamente).
          </li>
          <li>Recarga esta página: debe poner &quot;Conectado&quot; en verde.</li>
        </ol>
      )}
    </div>
  );
}
