import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Keep Turbopack rooted in this app (avoids picking up a parent package-lock)
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
