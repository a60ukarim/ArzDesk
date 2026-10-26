import type { NextConfig } from "next";
import { developmentOrigins } from "./src/lib/development-origins";
const nextConfig: NextConfig = {
  allowedDevOrigins: developmentOrigins(
    process.env.BETTER_AUTH_URL,
    process.env.NODE_ENV,
  ).map((origin) => new URL(origin).hostname),
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/offline",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/offline-assets.js",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Cache-Control", value: "no-store" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
