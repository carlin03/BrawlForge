"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function MatchCollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bf-match-collapsible ${open ? "is-open" : ""} ${className}`.trim()}>
      <button
        type="button"
        className="bf-match-collapsible-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="bf-match-collapsible-trigger-text">
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {badge && <span className="bf-match-collapsible-badge">{badge}</span>}
        <ChevronDown size={18} className="bf-match-collapsible-chevron" aria-hidden />
      </button>
      {open && <div className="bf-match-collapsible-body">{children}</div>}
    </div>
  );
}
