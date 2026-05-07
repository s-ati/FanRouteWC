import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // SerpAPI returns Google Photos CDN URLs. Loading them directly from the
    // browser hits a 429 due to Google rate-limiting browser-fingerprinted
    // requests; routing through Next's image optimizer fetches them
    // server-side once and serves the cached output to clients.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
      { protocol: "https", hostname: "streetviewpixels-pa.googleapis.com" },
    ],
  },
};

export default nextConfig;
