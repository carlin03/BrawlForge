import { loadCmsRuntime } from "@/lib/cms/runtime";
import { CmsRuntimeProvider } from "@/contexts/CmsRuntimeContext";

export async function CmsRuntimeLoader({ children }: { children: React.ReactNode }) {
  const runtime = await loadCmsRuntime();
  return <CmsRuntimeProvider value={runtime}>{children}</CmsRuntimeProvider>;
}
