import type { NextConfig } from "next";

// Note: Sentry runtime error capturing is handled by sentry.client.config.ts,
// sentry.server.config.ts, and sentry.edge.config.ts. The withSentryConfig
// build wrapper was removed due to incompatibility with Next.js 16 Turbopack.
// Source map uploads to Sentry can be configured separately via CI if needed.

const nextConfig: NextConfig = {
  typescript: {
    // Don't fail build on TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gemsngems.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'diyjewelry.us',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.ottofrei.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
