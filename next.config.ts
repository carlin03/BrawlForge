import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    /** En Vercel no hay public/logos: proxy + filtros CSS para logos remotos */
    NEXT_PUBLIC_LOGO_PROXY: process.env.VERCEL === "1" ? "1" : "0",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "liquipedia.net",
        pathname: "/commons/images/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "taiyoro-prod-media.s3.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  /** No empaquetar miles de PNG de public/logos en serverless (límite Vercel 300MB) */
  outputFileTracingExcludes: {
    "*": ["./public/logos/**", "./public/logos/**/*"],
  },
};

export default nextConfig;
