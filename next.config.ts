import type { Configuration as WebpackConfiguration } from 'webpack';
import type { NextConfig } from 'next';

type WebpackConfigContext = {
  readonly isServer: boolean;
  readonly dev: boolean;
};

const nextConfig: NextConfig = {
  webpack: (config: WebpackConfiguration, { isServer }: WebpackConfigContext): WebpackConfiguration => {
    config.module?.rules?.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[hash][ext]',
      },
    });

    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...(config.resolve?.fallback || {}),
          canvas: false,
        },
      };
    }

    return config;
  },
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
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;