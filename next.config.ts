
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle node-gyp-build if needed by any dependency
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // For server-side builds, externals `firebase-admin`
    if (isServer) {
        config.externals.push('firebase-admin');
    }

    return config;
  }
};

export default nextConfig;
