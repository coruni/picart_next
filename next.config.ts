import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const allowPrivateIpImages =
  process.env.NEXT_IMAGE_ALLOW_PRIVATE_IP === "true";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",

  images: {
    dangerouslyAllowLocalIP: allowPrivateIpImages,
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      { protocol: "https", hostname: "cf-s3.coslark.org" },
      { protocol: "https", hostname: "cf-s3.onecos.cc" },
      { protocol: "https", hostname: "image.acg.lol" },
      { protocol: "https", hostname: "upload-os-bbs.hoyolab.com" },
      // 生产环境用到的域名逐一加上
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

export default withNextIntl(nextConfig);
