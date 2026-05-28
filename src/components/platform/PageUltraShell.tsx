import type { ReactNode } from "react";

export function PageUltraShell({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`bf-page-ultra bf-motion-page ${className}`.trim()}>{children}</div>;
}
