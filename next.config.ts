import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.BACKEND_PROXY_TARGET || "http://localhost:8000";
    return [
      // 同源代理：将 /pyapi/api/* 转发到本机后端，避免浏览器跨域与预检问题
      {
        source: "/pyapi/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
