import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Listing photos and profile photos from the live API (stored on the server for now)
      { protocol: "https", hostname: "api.rezlify.com", pathname: "/storage/**" },
      // Listing photos later (Cloudflare R2 behind our CDN domain)
      { protocol: "https", hostname: "cdn.rezlify.com" },
      // Local Laravel storage while developing
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
    ],
    // Next.js 16 refuses to optimise images from local addresses by default.
    // Allow it only while developing, so photos from php artisan serve show up.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
