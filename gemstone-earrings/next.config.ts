import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail build on ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
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
