import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allowedDevOrigins: ["10.10.100.155"],
   allowedDevOrigins: ["192.168.1.250"],

  
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://192.168.1.250:5000";
    //  const backendUrl = process.env.BACKEND_API_URL || "http://10.10.100.155:5000";
    
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
