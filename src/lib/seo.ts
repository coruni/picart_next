import { configControllerGetPublicConfigs } from "@/api";
import { categoryControllerFindAll } from "@/api";
import { APP_NAME } from "@/constants";
import { routing } from "@/i18n/routing";
import { ArticleDetail, CollectionDetail, TagDetail, UserDetail } from "@/types";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getMetadataBase() {
  return new URL(APP_URL);
}

export function getLocalizedPath(locale: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) {
    return normalizedPath;
  }
  return `/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function buildLocalizedAlternates(locale: string, path: string) {
  return {
    canonical: getLocalizedPath(locale, path),
    languages: {
      "zh-CN": getLocalizedPath("zh", path),
      "en-US": getLocalizedPath("en", path),
    },
  };
}

function splitKeywords(values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Get public SEO config.
 */
async function fetchPublicConfig() {
  try {
    const response = await configControllerGetPublicConfigs();
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Failed to fetch public config:", error);
    return null;
  }
}

const getPublicConfigCached = unstable_cache(fetchPublicConfig, ["public-config"], {
  revalidate: 300,
});

export async function getPublicConfig() {
  const cached = await getPublicConfigCached();

  if (cached) {
    return cached;
  }

  // If the cached value is empty, retry once without cache so we don't keep
  // serving default SEO after a transient failure.
  const fresh = await fetchPublicConfig();
  return fresh ?? cached;
}

async function fetchPublicCategories() {
  try {
    const response = await categoryControllerFindAll({
      query: { limit: 100 },
    });
    return response.data?.data?.data ?? [];
  } catch (error) {
    console.error("Failed to fetch public categories:", error);
    return [];
  }
}

export const getPublicCategories = unstable_cache(
  fetchPublicCategories,
  ["public-categories"],
  {
    revalidate: 300,
  },
);

/**
 * Generate site metadata.
 */
export async function generateSiteMetadata(locale: string = "zh"): Promise<Metadata> {
  const config = await getPublicConfig();

  if (!config) {
      return {
        title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
      },
      description: "A modern image sharing platform",
      keywords: ["image", "art", "sharing", "community"],
      authors: [{ name: `${APP_NAME} Team` }],
      creator: APP_NAME,
      publisher: APP_NAME,
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: getMetadataBase(),
      alternates: buildLocalizedAlternates(locale, "/"),
        openGraph: {
          type: "website",
          locale,
          url: getLocalizedPath(locale, "/"),
        siteName: APP_NAME,
        title: APP_NAME,
          description: "A modern image sharing platform",
        },
        twitter: {
          card: "summary_large_image",
        title: APP_NAME,
          description: "A modern image sharing platform",
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
      manifest: "/manifest.webmanifest",
    };
  }

  const keywords = splitKeywords([
    config.site_keywords,
    config.seo_home_keywords,
    config.seo_long_tail_keywords,
  ]);

  return {
    title: {
      default: `${config.site_name || APP_NAME} | ${config.site_subtitle || APP_NAME}`,
      template: `%s | ${config.site_name || APP_NAME}`,
    },
    description:
      config.site_description || config.site_subtitle || "A modern image sharing platform",
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: config.site_name || `${APP_NAME} Team` }],
    creator: config.site_name || APP_NAME,
    publisher: config.site_name || APP_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: getMetadataBase(),
    alternates: buildLocalizedAlternates(locale, "/"),
    openGraph: {
      type: "website",
      locale,
      url: getLocalizedPath(locale, "/"),
      siteName: config.site_name || APP_NAME,
      title: config.site_name || APP_NAME,
      description:
        config.site_description || config.site_subtitle || "A modern image sharing platform",
      images: config.site_logo
        ? [
            {
              url: config.site_logo,
              width: 1200,
              height: 630,
              alt: config.site_name || APP_NAME,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: config.site_name || APP_NAME,
      description:
        config.site_description || config.site_subtitle || "A modern image sharing platform",
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
    manifest: "/manifest.webmanifest",
    other: {
      "contact:email": config.site_mail || "",
    },
  };
}

/**
 * Generate article metadata.
 */
export async function generateArticleMetadata(
  article: ArticleDetail | undefined | null,
  locale: string = "zh",
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || APP_NAME;

  if (!article) {
    return generateSiteMetadata(locale);
  }

  const keywords = splitKeywords([
    ...(article.tags?.map((tag) => tag.name) || []),
    config?.seo_article_page_keywords,
    config?.seo_long_tail_keywords,
  ]);
  const path = `/article/${article.id}`;
  const description = article.summary || config?.site_description || "";

  return {
    title: article.title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: article.author
      ? [{ name: article.author.nickname || article.author.username }]
      : undefined,
    alternates: buildLocalizedAlternates(locale, path),
    openGraph: {
      type: "article",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title: article.title,
      description,
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
      description,
      images: article.cover ? [article.cover] : undefined,
    },
  };
}

/**
 * Generate author metadata.
 */
export async function generateAuthorMetadata(
  author: UserDetail,
  locale: string = "zh",
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || APP_NAME;
  const path = `/account/${author.id}`;

  const keywords = splitKeywords([
    config?.seo_author_page_keywords,
    config?.seo_long_tail_keywords,
  ]);
  const title = author.nickname || author.username;
  const description = author.description || `${title} personal profile`;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: buildLocalizedAlternates(locale, path),
    openGraph: {
      type: "profile",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title,
      description,
      images: author.avatar
        ? [
            {
              url: author.avatar,
              width: 400,
              height: 400,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: author.avatar ? [author.avatar] : undefined,
    },
  };
}

/**
 * Generate topic index metadata.
 */
export async function generateTopicMetadata(
  locale: string = "zh",
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || APP_NAME;
  const path = "/topic";

  const keywords = splitKeywords([
    config?.site_keywords,
    config?.seo_long_tail_keywords,
  ]);

  const title = locale === "zh" ? "推荐话题" : "Recommended Topics";
  const description =
    locale === "zh"
      ? "浏览和关注感兴趣的话题，发现更多精彩内容"
      : "Browse and follow topics of interest, discover more exciting content";

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: buildLocalizedAlternates(locale, path),
    openGraph: {
      type: "website",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * Generate topic detail metadata.
 */
export async function generateTagMetadata(
  tag: TagDetail,
  locale: string = "zh",
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || APP_NAME;
  const path = `/topic/${tag.id}`;

  const keywords = splitKeywords([
    tag.name,
    config?.site_keywords,
    config?.seo_long_tail_keywords,
  ]);
  const title = `#${tag.name}`;
  const description =
    tag.description || `${tag.articleCount || 0} articles · ${tag.followCount || 0} followers`;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: buildLocalizedAlternates(locale, path),
    openGraph: {
      type: "website",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title,
      description,
      images: tag.cover || tag.avatar
        ? [
            {
              url: tag.cover || tag.avatar,
              width: 1200,
              height: 630,
              alt: tag.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: tag.cover || tag.avatar ? [tag.cover || tag.avatar] : undefined,
    },
  };
}

/**
 * Generate collection detail metadata.
 */
export async function generateCollectionMetadata(
  collection: CollectionDetail | undefined | null,
  locale: string = "zh",
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || APP_NAME;

  if (!collection) {
    return generateSiteMetadata(locale);
  }

  const path = `/account/${collection.userId}/collection/${collection.id}`;
  const title = collection.name;
  const description =
    collection.description ||
    `${collection.itemCount || 0} ${
      locale === "zh" ? "篇内容" : "items"
    } · ${collection.user?.nickname || collection.user?.username || siteName}`;
  const keywords = splitKeywords([
    collection.name,
    collection.user?.nickname,
    collection.user?.username,
    config?.seo_long_tail_keywords,
  ]);
  const previewImage =
    (typeof collection.cover === "string" && collection.cover) ||
    (typeof collection.avatar === "string" && collection.avatar) ||
    collection.user?.background ||
    collection.user?.avatar;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: collection.user
      ? [{ name: collection.user.nickname || collection.user.username }]
      : undefined,
    alternates: buildLocalizedAlternates(locale, path),
    openGraph: {
      type: "website",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title,
      description,
      images: previewImage
        ? [
            {
              url: previewImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: previewImage ? [previewImage] : undefined,
    },
  };
}

/**
 * Generate create post metadata.
 */
export async function generateCreatePostMetadata(
  locale: string = "zh",
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || APP_NAME;
  const path = "/create/post";

  const keywords = splitKeywords([
    config?.site_keywords,
    config?.seo_long_tail_keywords,
  ]);

  const title = locale === "zh" ? "发布帖子" : "Create Post";
  const description =
    locale === "zh"
      ? "发布你的帖子，与他人分享你的创作"
      : "Create your own post and share your creativity with others";

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: buildLocalizedAlternates(locale, path),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * Generate create image metadata.
 */
export async function generateCreateImageMetadata(
  locale: string = "zh",
): Promise<Metadata> {
  const config = await getPublicConfig();
  const siteName = config?.site_name || APP_NAME;
  const path = "/create/image";

  const keywords = splitKeywords([
    config?.site_keywords,
    config?.seo_long_tail_keywords,
  ]);

  const title = locale === "zh" ? "发布图片" : "Create Image";
  const description =
    locale === "zh"
      ? "发布你的图片内容，与他人分享你的创作"
      : "Create an image post and share your work with others";

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: buildLocalizedAlternates(locale, path),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
