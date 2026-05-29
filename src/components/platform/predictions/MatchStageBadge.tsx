import type { MatchStageMeta } from "@/lib/data/match-stage-meta";

export function MatchStageBadge({ meta, large }: { meta: MatchStageMeta; large?: boolean }) {
  return (
    <span
      className={`bf-predict-stage-badge ${meta.badgeClass} ${meta.cardClass} ${large ? "is-large" : ""}`}
    >
      {meta.label}
    </span>
  );
}
