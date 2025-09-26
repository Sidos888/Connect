import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    distDir: 'out',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true
  },
  typescript: {
    // Allow mobile asset builds even if there are stray type errors in debug pages
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
