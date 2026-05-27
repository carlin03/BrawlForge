import { Suspense } from "react";
import { FantasyView } from "@/components/platform/FantasyView";

export default function FantasyPage() {
  return (
    <Suspense fallback={<div className="bp-empty">Cargando fantasy…</div>}>
      <FantasyView />
    </Suspense>
  );
}
