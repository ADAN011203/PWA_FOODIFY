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
  // Rewrites eliminados para producción (se usan URLs absolutas en api.ts)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default withPWA(nextConfig);

