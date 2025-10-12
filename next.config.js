/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable static file serving for game assets
  async rewrites() {
    return [
      // Serve game assets from public directory
      {
        source: '/img/:path*',
        destination: '/img/:path*',
      },
      {
        source: '/audio/:path*',
        destination: '/audio/:path*',
      },
      {
        source: '/maps/:path*',
        destination: '/maps/:path*',
      },
    ];
  },

  // Webpack configuration for Phaser.js
  webpack: (config, { isServer }) => {
    // Handle Phaser.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Handle canvas for server-side rendering
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    esmExternals: true,
  },

  // Output configuration
  output: 'standalone',
  
  // Disable image optimization for game assets
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
