import type { PredictDisplayStatus } from "@/lib/data/match-stage-meta";
import { PREDICT_STATUS_LABELS } from "@/lib/data/match-stage-meta";

export function MatchStatusPill({ status, compact }: { status: PredictDisplayStatus; compact?: boolean }) {
  const meta = PREDICT_STATUS_LABELS[status];
  return (
    <span className={`bf-predict-status-pill ${meta.className} ${compact ? "is-compact" : ""}`}>
      <span className="bf-predict-status-emoji" aria-hidden>
        {meta.emoji}
      </span>
      {meta.label}
    </span>
  );
}
