import type { NextConfig } from "next";

// Use filesystem route handler at app/pyapi/api/[...path]/route.ts for proxying.
// Remove conflicting rewrites to avoid Next dev proxy intercepting requests.
const nextConfig: NextConfig = {
  async rewrites() {
    return [];
  },
};

export default nextConfig;
