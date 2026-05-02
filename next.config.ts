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
  allowedDevOrigins: [
    'localhost',
    'localhost:81',
    '.space-z.ai',
    '.z.ai',
  ],
};

export default nextConfig;
