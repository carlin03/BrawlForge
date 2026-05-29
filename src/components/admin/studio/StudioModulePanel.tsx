"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Props = {
  title: string;
  description: string;
  apiPath: string;
  children?: (data: Record<string, unknown>, reload: () => void) => React.ReactNode;
};

export function StudioModulePanel({ title, description, apiPath, children }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch(apiPath);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al cargar");
      setData(json);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setLoading(false);
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="bf-studio-panel">
      <div className="bf-studio-panel-head">
        <div>
          <h2>{title}</h2>
          <p className="bf-studio-lead">{description}</p>
        </div>
        <button type="button" className="bp-btn bp-btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>
      {msg && <p className={error ? "bf-studio-msg is-error" : "bf-studio-msg"}>{msg}</p>}
      {loading ? (
        <p className="bf-studio-muted">Cargando…</p>
      ) : children ? (
        children(data, load)
      ) : (
        <pre className="bf-studio-json">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
