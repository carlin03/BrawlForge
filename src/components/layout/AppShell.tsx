import { PlatformShell } from "@/components/platform/PlatformShell";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
