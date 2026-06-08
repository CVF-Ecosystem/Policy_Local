import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'mammoth'],
  turbopack: {},
};

export default nextConfig;
