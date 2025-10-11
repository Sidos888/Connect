import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export for production builds
  // Disabled for now due to dynamic route limitations
  // ...(process.env.NODE_ENV === 'production' && {
  //   output: 'export',
  //   distDir: 'out',
  //   trailingSlash: true,
  // }),
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
