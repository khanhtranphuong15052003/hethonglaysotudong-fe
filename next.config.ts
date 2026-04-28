import type { NextConfig } from "next";

const role = process.env.NEXT_PUBLIC_APP_ROLE; // "staff" | "admin"

const nextConfig: NextConfig = {
  distDir: role ? `.next-${role}` : ".next",
  allowedDevOrigins: ["192.168.1.32"], 
  async rewrites() {
      const backendUrl = process.env.BACKEND_API_URL || "http://192.168.1.32:6060"; 
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
