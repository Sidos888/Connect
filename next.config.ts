import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Always use static export so Capacitor can read from ./out
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  typescript: {
    // Allow mobile asset builds even if there are stray type errors in debug pages
    ignoreBuildErrors: true,
  },
  reactStrictMode: false, // Disable for Capacitor iOS compatibility
  compiler: {
    removeConsole: false, // Keep console logs for debugging
  },
};

export default nextConfig;
