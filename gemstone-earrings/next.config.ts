import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

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

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
});
