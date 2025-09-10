import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Capacitor mobile app
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    distDir: 'out'
  }),
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable caching for development to ensure mobile gets latest version
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;