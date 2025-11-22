/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // CRITICAL: Disable SWC minifier - causes "Identifier 'n' already declared" with hashconnect
  compress: true, // Use default compression (Terser)
  images: {
    domains: ['localhost', 'ipfs.io', 'hashscan.io'],
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer, dev }) => {
    // Fix for HashConnect crypto module issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        net: false,
        tls: false,
        fs: false,
        http2: false,
        os: false,
        path: false,
        util: false,
        dns: false,
      };

      // Exclude dev files from production bundle
      config.module.rules.push({
        test: /\.iife_dev\.js$/,
        use: 'null-loader',
      });

      // Prevent double-loading of wallet libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        buffer: 'buffer',
      };
    } else {
      // Ignore wallet libraries on server side
      config.externals = config.externals || [];
      config.externals.push({
        'hashconnect': 'commonjs hashconnect',
        '@hashgraph/sdk': 'commonjs @hashgraph/sdk',
      });
    }

    return config;
  },
  // Disable optimizeCss to avoid critters dependency issue
  // experimental: {
  //   optimizeCss: true,
  // },
}

module.exports = nextConfig
