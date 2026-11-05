import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static demo on GitHub Pages lives under /<repo>; unset otherwise.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // Classic rendering model: pages read from Postgres per request / ISR,
  // and the admin calls revalidatePath() after every publish.
  cacheComponents: false,
  images: {
    remotePatterns: [
      // Duda CDN – only until media is migrated to our own storage
      { protocol: "https", hostname: "irp.cdn-website.com" },
      { protocol: "https", hostname: "lirp.cdn-website.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
