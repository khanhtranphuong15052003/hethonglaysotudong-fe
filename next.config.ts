import type { NextConfig } from "next";

const nextConfig: NextConfig = {
     allowedDevOrigins: ["192.168.1.102"], 
  async rewrites() {
      const backendUrl = process.env.BACKEND_API_URL || "http://192.168.1.102:6060"; 
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
