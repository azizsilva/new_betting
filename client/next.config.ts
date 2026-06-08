import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "www.kingsbet.cz" },
      { protocol: "https", hostname: "static.slot7hub.com" },
      { protocol: "https", hostname: "**.slot7hub.com" },
      { protocol: "https", hostname: "**.gamble-hub.net" },
      { protocol: "https", hostname: "**.gambllyapi.com" },
      { protocol: "https", hostname: "**.amatic.com" },
      { protocol: "https", hostname: "**.pragmaticplay.net" },
      { protocol: "https", hostname: "**.evolutiongaming.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/live-casino", destination: "/casino?tab=live-casino", permanent: false },
      { source: "/promotions", destination: "/casino", permanent: false },
      { source: "/live-sports", destination: "/casino/play/8a704858d5deb4af1ddc722092ac7614?account=gambly", permanent: false },
    ];
  },
};

export default nextConfig;
