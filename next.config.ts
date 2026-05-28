import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
