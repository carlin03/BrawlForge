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

/** Solo muestra aviso si hay un problema real de conexión o tablas. */
export function SupabaseStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supabase/status")
      .then(async (r) => {
        if (r.status === 404) {
          setStatus({
            connected: false,
            auth: false,
            profilesTable: false,
            message: "Servicio de cuenta no disponible en este despliegue.",
          });
          return;
        }
        const data = (await r.json()) as Status;
        setStatus(data);
      })
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

  if (loading) return null;

  if (!status) return null;

  const ok = status.connected && status.profilesTable && status.tablesOk !== false;
  if (ok) return null;

  const cls = status.connected ? "is-warn" : "is-error";

  return (
    <div className={`bf-supabase-status ${cls}`}>
      <p className="bf-supabase-status-title">
        {status.connected ? "Cuenta: configuración pendiente" : "Sin conexión"}
      </p>
      {!status.connected && (
        <p className="bf-supabase-status-msg">Inténtalo más tarde o contacta soporte.</p>
      )}
    </div>
  );
}
