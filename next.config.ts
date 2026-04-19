import type { NextConfig } from "next";

const stripTrailingSlash = (value: string) =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const normalizeBackendOrigin = (value?: string) => {
  if (!value) {
    return "http://192.168.1.70:5000";
  }

  const normalized = stripTrailingSlash(value.trim());
  return normalized.endsWith("/api")
    ? normalized.slice(0, -"/api".length)
    : normalized;
};

const nextConfig: NextConfig = {
  // allowedDevOrigins: ["10.10.100.155"],
   allowedDevOrigins: ["192.168.1.70"],

  
  async rewrites() {
    const backendUrl = normalizeBackendOrigin(process.env.BACKEND_API_URL);
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
