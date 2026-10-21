import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
    return [
      {
        source: "/lab-api/:path*",
        destination: `${backendUrl}/lab/:path*`,
      },
    ];
  },
};

export default nextConfig;

