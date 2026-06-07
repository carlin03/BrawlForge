"use client";

import { useCmsHome } from "@/contexts/CmsRuntimeContext";
import { HomeView } from "@/components/platform/HomeView";
import { HomeViewRenderer } from "@/components/cms/HomeViewRenderer";

export function HomePageRouter() {
  const home = useCmsHome();
  if (!home.enabled) return <HomeView />;
  return <HomeViewRenderer home={home} />;
}
