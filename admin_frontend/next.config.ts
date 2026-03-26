import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sociala-images-bucket.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "realbro-s3.s3.amazonaws.com"
      }
    ],
  },
};

export default nextConfig;
