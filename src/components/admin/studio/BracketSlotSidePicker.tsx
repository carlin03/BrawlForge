"use client";

import type { BracketRoundKind } from "@/lib/data/bracket-slot-display";
import {
  bracketRefOptions,
  bracketSlotDisplayLabel,
  isBracketPlaceholderSlug,
  isFixedTeamRef,
} from "@/lib/data/bracket-slot-display";
import { AdminTeamLogoPicker } from "@/components/admin/AdminTeamLogoPicker";
import { StudioField, StudioSelect } from "./studio-ui";

type TeamOption = { slug: string; name: string; tag: string; region?: string };

export function BracketSlotSidePicker({
  label,
  slug,
  onChange,
  teams,
  round,
}: {
  label: string;
  slug: string;
  onChange: (slug: string) => void;
  teams: TeamOption[];
  round: BracketRoundKind;
}) {
  const options = bracketRefOptions(round);
  const isRef = isBracketPlaceholderSlug(slug);
  const mode = isRef ? slug || "" : "__team__";

  return (
    <StudioField label={label}>
      <StudioSelect
        value={mode}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__team__") onChange("");
          else onChange(v);
        }}
      >
        {options.map((o) => (
          <option key={o.id || "tbd"} value={o.id || ""}>
            {o.label}
          </option>
        ))}
      </StudioSelect>
      {mode === "__team__" && (
        <AdminTeamLogoPicker
          teams={teams}
          selected={isFixedTeamRef(slug) ? slug : ""}
          onChange={onChange}
          compact
          maxHeight="140px"
          showRegionFilter={false}
        />
      )}
      {isRef && slug && (
        <p className="bf-studio-hint" style={{ marginTop: 6 }}>
          Vista previa: <strong>{bracketSlotDisplayLabel(slug)}</strong>
        </p>
      )}
    </StudioField>
  );
}
