import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Country flags used in the sportsbook.
      { protocol: "https", hostname: "flagcdn.com" },
      // Used for game images
      { protocol: "https", hostname: "www.kingsbet.cz" },
    ],
  },
};

export default nextConfig;
