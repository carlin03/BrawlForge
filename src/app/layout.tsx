import type { Metadata } from "next";
import "./globals.css";
import { InstantBootShell, INSTANT_CRITICAL_CSS } from "@/components/layout/InstantBootShell";
import { BootRelease } from "@/components/layout/BootRelease";
import { DeferredApp } from "@/components/layout/DeferredApp";
import { DEFAULT_LEGACY_CONFIG } from "@/lib/cms/defaults";
import { SITE_URL } from "@/lib/site-url";

export function generateMetadata(): Metadata {
  const seo = DEFAULT_LEGACY_CONFIG.settings.seo;
  return {
    metadataBase: new URL(SITE_URL),
    title: seo.title,
    description: seo.description,
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    applicationName: "BrawlForge",
    appleWebApp: {
      capable: true,
      title: "BrawlForge",
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0c12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full" style={{ background: "#0a0c12", color: "#f4f4f5" }}>
      <head>
        <style id="bf-critical-boot" dangerouslySetInnerHTML={{ __html: INSTANT_CRITICAL_CSS }} />
      </head>
      <body
        className="min-h-full antialiased"
        style={{ background: "#0a0c12", color: "#f4f4f5", margin: 0, minHeight: "100%" }}
      >
        <InstantBootShell />
        <BootRelease />
        <DeferredApp>{children}</DeferredApp>
      </body>
    </html>
  );
}
