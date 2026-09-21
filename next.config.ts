import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tong.visitkorea.or.kr",
        pathname: "/cms/resource/**",
      },
      {
        protocol: "http",
        hostname: "tong.visitkorea.or.kr",
        pathname: "/cms/resource/**",
      },
    ],
  },
};

export default nextConfig;
