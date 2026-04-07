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
