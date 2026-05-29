"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { Region } from "@/lib/types";

export type AdminTeamPickerOption = {
  slug: string;
  name: string;
  tag: string;
  region?: Region | string;
};

const REGION_FILTERS: { id: "all" | Region; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "EMEA", label: "EMEA" },
  { id: "EA", label: "EA" },
  { id: "NA", label: "NA" },
  { id: "SA", label: "SA" },
];

type MultiProps = {
  multiple: true;
  selected: string[];
  onChange: (slugs: string[]) => void;
};

type SingleProps = {
  multiple?: false;
  selected: string;
  onChange: (slug: string) => void;
};

type BaseProps = {
  teams: AdminTeamPickerOption[];
  searchPlaceholder?: string;
  maxHeight?: string;
  disabledSlugs?: string[];
  showRegionFilter?: boolean;
  compact?: boolean;
};

export function AdminTeamLogoPicker(props: BaseProps & (MultiProps | SingleProps)) {
  const {
    teams,
    searchPlaceholder = "Buscar club…",
    maxHeight = "320px",
    disabledSlugs = [],
    showRegionFilter = true,
    compact = false,
  } = props;

  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | Region>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    if (showRegionFilter && regionFilter !== "all") {
      list = list.filter((t) => t.region === regionFilter);
    }
    if (!q) return list;
    return list.filter(
      (t) =>
        t.slug.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q),
    );
  }, [teams, search, regionFilter, showRegionFilter]);

  const selectedSet = useMemo(() => {
    if (props.multiple) return new Set(props.selected);
    return props.selected ? new Set([props.selected]) : new Set<string>();
  }, [props]);

  function toggle(slug: string) {
    if (disabledSlugs.includes(slug)) return;
    if (props.multiple) {
      const next = new Set(props.selected);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      props.onChange([...next]);
    } else {
      props.onChange(props.selected === slug ? "" : slug);
    }
  }

  const count = props.multiple ? props.selected.length : props.selected ? 1 : 0;

  return (
    <div className={`bf-admin-team-logo-picker ${compact ? "is-compact" : ""}`}>
      {showRegionFilter && (
        <div className="bf-admin-region-filters" role="group" aria-label="Filtrar por región">
          {REGION_FILTERS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`bf-admin-region-chip ${regionFilter === r.id ? "is-on" : ""}`}
              onClick={() => setRegionFilter(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      <div className="bf-admin-search-wrap" style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--bp-dim)" }} />
        <input
          className="bf-admin-search"
          style={{ paddingLeft: 40 }}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="bf-admin-logos-grid bf-admin-team-picker-grid" style={{ maxHeight }}>
        {filtered.map((t) => {
          const on = selectedSet.has(t.slug);
          const disabled = disabledSlugs.includes(t.slug);
          return (
            <button
              key={t.slug}
              type="button"
              className={`bf-admin-logo-tile ${on ? "is-on" : ""} ${disabled ? "is-disabled" : ""}`}
              onClick={() => toggle(t.slug)}
              disabled={disabled}
              title={`${t.tag} · ${t.name}`}
            >
              {on && (
                <span className="bf-admin-logo-tile-check" aria-hidden>
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
              <TeamLogo slug={t.slug} name={t.name} size={compact ? 40 : 48} />
              <span className="bf-admin-logo-tile-name">{t.tag}</span>
              {!compact && <span className="bf-admin-logo-tile-sub">{t.name}</span>}
            </button>
          );
        })}
      </div>
      {props.multiple && (
        <p className="bf-admin-field-hint" style={{ marginTop: 8 }}>
          {count} club{count === 1 ? "" : "es"} seleccionado{count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
