import { getPublicConfig } from "@/lib/seo";
import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const sitemap = new URL("/sitemap.xml", APP_URL).toString();

  try {
    const config = await getPublicConfig();

    if (config?.maintenance_mode) {
      return {
        rules: {
          userAgent: "*",
          disallow: "/",
        },
        sitemap,
      };
    }

    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap,
    };
  } catch {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: new URL("/sitemap.xml", APP_URL).toString(),
    };
  }
}
