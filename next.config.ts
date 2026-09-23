import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices and local network clients to connect to dev server HMR without cross-origin blocking
  allowedDevOrigins: [
    "localhost:3000",
    "localhost:3001",
    "127.0.0.1:3000",
    "127.0.0.1:3001",
    "192.168.1.23",
    "192.168.1.23:3000",
    "192.168.1.23:3001",
  ],
};

export default nextConfig;
