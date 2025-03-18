import type { NextConfig } from 'next';



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
};

export default nextConfig;