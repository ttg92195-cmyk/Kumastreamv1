import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true, // TODO: Set to false after fixing all TypeScript errors
  },
  reactStrictMode: true,
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  // Build-time env fallbacks for database URLs
  // SECURITY: No hardcoded connection strings - if env vars are missing, use empty strings
  // Prisma will throw a clear error at runtime if DATABASE_URL is not configured
  env: {
    DATABASE_URL: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || '',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL || '',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING || '',
  },
};

export default nextConfig;
