import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
const allowPrivateIpImages = process.env.NEXT_IMAGE_ALLOW_PRIVATE_IP === "true";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins:["192.168.1.7"],
  images: {
    dangerouslyAllowLocalIP: allowPrivateIpImages,
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.picart.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.picart.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    qualities: [75, 95],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/css/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/chunks/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*.css",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },

    optimizePackageImports: [
      "swiper",
      "quill",
      "viewerjs",
      "@hey-api/client-fetch",
    ],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
