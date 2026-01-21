import { configControllerGetPublicConfigs } from "@/api";
import { ArticleDetail, UserDetail } from "@/types";
import type { Metadata } from "next";

/**
 * 获取公共配置
 */
export async function getPublicConfig() {
  try {
    const response = await configControllerGetPublicConfigs();
    if (response.data?.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch public config:", error);
    return null;
  }
}

/**
 * 生成网站 SEO 元数据
 */
export async function generateSiteMetadata(locale: string = "zh"): Promise<Metadata> {
  const config = await getPublicConfig();

  if (!config) {
    // 默认 SEO 配置
    return {
      title: {
        default: "PicArt",
        template: "%s | PicArt",
      },
      description: "A modern image sharing platform",
      keywords: ["image", "art", "sharing", "community"],
      authors: [{ name: "PicArt Team" }],
      creator: "PicArt",
      publisher: "PicArt",
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      alternates: {
        canonical: "/",
        languages: {
          "zh-CN": "/zh",
          "en-US": "/en",
        },
      },
      openGraph: {
        type: "website",
        locale: locale,
        url: "/",
        siteName: "PicArt",
        title: "PicArt",
        description: "A modern image sharing platform",
        images: [
          {
            url: "/og-image.png",
            width: 1200,
            height: 630,
            alt: "PicArt",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "PicArt",
        description: "A modern image sharing platform",
        images: ["/og-image.png"],
        creator: "@picart",
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
      },
      manifest: "/site.webmanifest",
    };
  }

  // 从 API 配置生成 SEO 元数据
  const keywords = [
    config.site_keywords,
    config.seo_home_keywords,
    config.seo_long_tail_keywords,
  ]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: {
      default: `${config.site_name} | ${config.site_subtitle}` || "PicArt",
      template: `%s | ${config.site_name || "PicArt"}`,
    },
    description: config.site_description || config.site_subtitle || "A modern image sharing platform",
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: config.site_name || "PicArt Team" }],
    creator: config.site_name || "PicArt",
    publisher: config.site_name || "PicArt",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    alternates: {
      canonical: "/",
      languages: {
        "zh-CN": "/zh",
        "en-US": "/en",
      },
    },
    openGraph: {
      type: "website",
      locale: locale,
      url: "/",
      siteName: config.site_name || "PicArt",
      title: config.site_name || "PicArt",
      description: config.site_description || config.site_subtitle || "A modern image sharing platform",
      images: config.site_logo
        ? [
          {
            url: config.site_logo,
            width: 1200,
            height: 630,
            alt: config.site_name || "PicArt",
          },
        ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: config.site_name || "PicArt",
      description: config.site_description || config.site_subtitle || "A modern image sharing platform",
      images: config.site_logo ? [config.site_logo] : undefined,
      creator: `@${config.site_name?.toLowerCase() || "picart"}`,
    },
    robots: {
      index: !config.maintenance_mode,
      follow: !config.maintenance_mode,
      googleBot: {
        index: !config.maintenance_mode,
        follow: !config.maintenance_mode,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: config.site_favicon || "/favicon.ico",
      shortcut: config.site_favicon || "/favicon.ico",
      apple: config.site_logo || "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    other: {
      "contact:email": config.site_mail || "",
    },
  };
}

/**
 * 生成文章页面 SEO 元数据
 */
export async function generateArticleMetadata(
  article: ArticleDetail,
  locale: string = "zh"
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || "PicArt";

  const keywords = [
    ...(article.tags || []),
    config?.seo_article_page_keywords,
    config?.seo_long_tail_keywords,
  ]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: article.title,
    description: article.summary || config?.site_description || "",
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: article.author ? [{ name: article.author.nickname || article.author.username }] : undefined,
    openGraph: {
      type: "article",
      locale: locale,
      siteName: siteName,
      title: article.title,
      description: article.summary || "",
      images: article.cover
        ? [
          {
            url: article.cover,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ]
        : undefined,
      publishedTime: article.createdAt,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary || "",
      images: article.cover ? [article.cover] : undefined,
    },
  };
}

/**
 * 生成作者页面 SEO 元数据
 */
export async function generateAuthorMetadata(
  author: UserDetail,
  locale: string = "zh"
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || "PicArt";

  const keywords = [config?.seo_author_page_keywords, config?.seo_long_tail_keywords]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: `${author.nickname || author.username}`,
    description: author.description || `${author.nickname || author.nickname} 的个人主页`,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      type: "profile",
      locale: locale,
      siteName: siteName,
      title: author.nickname || author.username,
      description: author.description || "",
      images: author.avatar
        ? [
          {
            url: author.avatar,
            width: 400,
            height: 400,
            alt: author.nickname || author.username,
          },
        ]
        : undefined,
    },
    twitter: {
      card: "summary",
      title: author.nickname || author.username,
      description: author.description || "",
      images: author.avatar ? [author.avatar] : undefined,
    },
  };
}
