/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  webpack(config) {
    // Find the existing rule for SVGs (Next.js may have a default rule)
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));

    config.module.rules.push(
      // Handle SVGs as React components for .js/.tsx imports
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
      // Handle SVGs as URLs for other cases (e.g., next/image)
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // For imports like *.svg?url
      }
    );

    // Exclude SVGs from the default file loader rule
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
  output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
      ignoreBuildErrors: true, 
    },
    images: { unoptimized: true }, 

// swcMinify: false,
};

module.exports = nextConfig;
