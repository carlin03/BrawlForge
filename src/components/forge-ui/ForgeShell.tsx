import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function ForgeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="x-root">
      <Sidebar />
      <div className="x-main-wrap">
        <Topbar />
        <div className="x-content">{children}</div>
      </div>
    </div>
  );
}
