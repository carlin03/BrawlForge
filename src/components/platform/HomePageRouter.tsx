"use client";

import dynamic from "next/dynamic";
import { useCmsHome } from "@/contexts/CmsRuntimeContext";
import { HomeSkeleton } from "@/components/platform/HomeSkeleton";
import { HomeViewRenderer } from "@/components/cms/HomeViewRenderer";

const HomeView = dynamic(() => import("@/components/platform/HomeView").then((m) => m.HomeView), {
  ssr: false,
  loading: () => <HomeSkeleton />,
});

export function HomePageRouter() {
  const home = useCmsHome();
  if (!home.enabled) return <HomeView />;
  return <HomeViewRenderer home={home} />;
}
