import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
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
      serverActions: {
        bodySizeLimit: '135mb',
      },
    },

  };
  
  module.exports = nextConfig;