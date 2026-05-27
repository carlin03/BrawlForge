"use client";

import type { ReactNode } from "react";

type LogoKind = "team" | "tournament";

interface LogoFrameProps {
  children: ReactNode;
  size: number;
  kind?: LogoKind;
  glow?: boolean;
  className?: string;
  title?: string;
}

export function LogoFrame({ children, size, kind = "team", glow = true, className = "", title }: LogoFrameProps) {
  return (
    <div
      className={`bf-logo-frame bf-logo-frame-${kind} ${glow ? "has-glow" : ""} ${className}`.trim()}
      style={{ width: size, height: size }}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      <div className="bf-logo-frame-ring" aria-hidden />
      <div className="bf-logo-frame-inner">{children}</div>
    </div>
  );
}
