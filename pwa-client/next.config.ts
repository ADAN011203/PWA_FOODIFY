import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/(para-llevar|en-restaurante|ordenes|contacto)/,
      handler: "NetworkFirst",
      options: { cacheName: "foodify-pages", expiration: { maxEntries: 10, maxAgeSeconds: 86400 } },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: { cacheName: "foodify-images", expiration: { maxEntries: 60, maxAgeSeconds: 604800 } },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
      handler: "CacheFirst",
      options: { cacheName: "foodify-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
    },
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "foodify-static", expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://3.142.73.52:3000";
    return [
      {
        source: "/api_proxy/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Fix for Next.js 16 Turbopack with next-pwa
  turbopack: {},
};

export default withPWA(nextConfig);

