import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Reduce memory usage in dev mode
  experimental: {
    memoryBasedWorkersCount: true,
  },
};

export default nextConfig;
