"use client";

import type { ReactNode } from "react";

export function AdminField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`bf-admin-field ${className}`}>
      <span className="bf-admin-field-label">{label}</span>
      {hint && <span className="bf-admin-field-hint">{hint}</span>}
      <div className="bf-admin-field-control">{children}</div>
    </label>
  );
}

export function AdminFieldRow({ children }: { children: ReactNode }) {
  return <div className="bf-admin-field-row">{children}</div>;
}

export function AdminMeta({ children }: { children: ReactNode }) {
  return <p className="bf-admin-meta">{children}</p>;
}
