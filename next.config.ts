import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Enable static export for Capacitor mobile builds (only for production builds)
  ...(isDev ? {} : { output: 'export' }),
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    // Unblock deployments while we fix CI lint rules incrementally
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow mobile asset builds even if there are stray type errors in debug pages
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
