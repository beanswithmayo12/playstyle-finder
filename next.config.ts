import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg-static resolves its binary via __dirname, which the bundler
  // rewrites to a virtual /ROOT/ path — keep it external so Node resolves
  // the real filesystem location at runtime.
  serverExternalPackages: ["ffmpeg-static"],
  // Reel uploads in local-storage dev mode PUT up to 250 MB through
  // middleware-covered routes; default cap is 10 MB (silent truncation).
  experimental: {
    middlewareClientMaxBodySize: 262144000, // 250 MB
  },
};

export default nextConfig;
