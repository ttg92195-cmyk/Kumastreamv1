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
  // Provide fallback DATABASE_URL during build if not set
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public',
  },
};

export default nextConfig;
