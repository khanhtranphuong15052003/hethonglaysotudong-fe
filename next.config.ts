import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // allowedDevOrigins: ["192.168.1.70"],
     allowedDevOrigins: ["192.168.1.13"],

  
  async rewrites() {
   
    //  const backendUrl = process.env.BACKEND_API_URL || "http://192.168.1.70:6060";
      const backendUrl = process.env.BACKEND_API_URL || "http://192.168.1.13:6060";
    
    
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
