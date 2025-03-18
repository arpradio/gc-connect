// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          pathname: '/ipfs/**',
        },
        {
          protocol: 'https',
          hostname: 'ipfs.io',
          pathname: '/ipfs/**',
        },
        {
          protocol: 'https',
          hostname: 'permagate.io',
          pathname: '/**',
        },
      ],
    },
    experimental: {
      serverActions: true,
    },
    typescript: {
      // Temporarily ignore TypeScript errors in build process
      ignoreBuildErrors: true,
    },
    eslint: {
      // Temporarily ignore ESLint errors in build process
      ignoreDuringBuilds: true,
    },
  };
  
  module.exports = nextConfig;