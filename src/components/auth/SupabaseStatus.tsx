"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  auth: boolean;
  profilesTable: boolean;
  tablesOk?: boolean;
  missingTables?: string[];
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

  const ok = status.connected && status.profilesTable && status.tablesOk !== false;
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
      {status.connected && !ok && (
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
            en tu proyecto Supabase.
          </li>
          <li>
            Copia <strong>todo</strong> el archivo{" "}
            <a
              href="https://raw.githubusercontent.com/carlin03/BrawlForge/main/supabase/ALL_IN_ONE_SETUP.sql"
              target="_blank"
              rel="noopener noreferrer"
            >
              ALL_IN_ONE_SETUP.sql
            </a>{" "}
            (GitHub) → pega → <strong>Run</strong>.
          </li>
          {status.missingTables?.length ? (
            <li>
              Faltan tablas: <code>{status.missingTables.join(", ")}</code>
            </li>
          ) : null}
          <li>Recarga esta página hasta ver &quot;Supabase listo&quot; en verde.</li>
        </ol>
      )}
    </div>
  );
}
