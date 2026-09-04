import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reel uploads in local-storage dev mode PUT up to 250 MB through
  // middleware-covered routes; default cap is 10 MB (silent truncation).
  experimental: {
    middlewareClientMaxBodySize: 262144000, // 250 MB
  },
};

export default nextConfig;
