import type { Metadata } from "next";
import "./globals.css";
import { CRITICAL_BOOT_CSS } from "@/components/layout/critical-boot-css";
import AppInner from "@/components/layout/AppInner";
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

const PREFETCH_BOOT = `(function(){var u=["/api/home/matches","/api/catalog","/api/cms/runtime","/api/news","/api/logos/config"];var d=window.__bfPrefetchData=window.__bfPrefetchData||{};var f=window.__bfPrefetchInflight=window.__bfPrefetchInflight||{};for(var i=0;i<u.length;i++){(function(url){if(d[url]||f[url])return;f[url]=fetch(url,{cache:"no-store",credentials:"same-origin"}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j!=null)d[url]=j;return j}).catch(function(){return null}).finally(function(){delete f[url]});})(u[i]);}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full" style={{ background: "#0a0c12", color: "#f4f4f5" }}>
      <head>
        <style id="bf-critical-boot" dangerouslySetInnerHTML={{ __html: CRITICAL_BOOT_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: PREFETCH_BOOT }} />
      </head>
      <body
        className="min-h-full antialiased"
        style={{ background: "#0a0c12", color: "#f4f4f5", margin: 0, minHeight: "100%" }}
      >
        <AppInner>{children}</AppInner>
      </body>
    </html>
  );
}
