import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // 型エラーを無視
  },
  eslint: {
    ignoreDuringBuilds: true, // ESLintエラーを無視
  },
};

export default nextConfig;
