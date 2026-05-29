"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { StudioEmpty, StudioLoading, StudioPanel, StudioToast } from "./studio-ui";

type Props = {
  title: string;
  lead: string;
  apiPath: string;
  children?: (data: Record<string, unknown>, reload: () => void) => ReactNode;
  emptyTitle?: string;
  emptyHint?: string;
};

export function StudioModulePanel({
  title,
  lead,
  apiPath,
  children,
  emptyTitle = "Todo listo por ahora",
  emptyHint = "Usa los controles de arriba para empezar.",
}: Props) {
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
      if (!res.ok) throw new Error(json.error || "No se pudo cargar. Comprueba que iniciaste sesión como admin.");
      setData(json);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error al cargar");
      setError(true);
    }
    setLoading(false);
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StudioPanel
      title={title}
      lead={lead}
      actions={
        <button type="button" className="bp-btn bp-btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> Actualizar lista
        </button>
      }
    >
      <StudioToast message={msg} error={error} />
      {loading ? (
        <StudioLoading />
      ) : children ? (
        children(data, load)
      ) : (
        <StudioEmpty title={emptyTitle}>
          <p className="bf-studio-muted">{emptyHint}</p>
        </StudioEmpty>
      )}
    </StudioPanel>
  );
}
