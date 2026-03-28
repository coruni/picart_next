import {
  articleControllerGetPublishedArticleIds,
  categoryControllerFindAll,
  tagControllerFindAll,
  userControllerFindAll,
} from "@/api";
import { routing } from "@/i18n/routing";
import { getLocalizedPath, getPublicConfig } from "@/lib/seo";
import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
export const revalidate = 3600;

type SitemapItem = {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
  children?: SitemapItem[];
};

type PagedApiResponse<T> = {
  data?: {
    data?: {
      data?: T[];
    };
  };
};

function toAbsoluteUrl(locale: string, path: string) {
  return new URL(getLocalizedPath(locale, path), APP_URL).toString();
}

async function collectPagedItems<T>(
  fetchPage: (page: number, limit: number) => Promise<unknown>,
): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = (await fetchPage(page, PAGE_SIZE)) as PagedApiResponse<T>;
    const pageItems = response.data?.data?.data ?? [];

    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      break;
    }

    items.push(...pageItems);

    if (pageItems.length < PAGE_SIZE) {
      break;
    }
  }

  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getPublicConfig();
  if (config?.maintenance_mode) {
    return [];
  }

  const [categories, tags, publishedArticles, users] = await Promise.all([
    collectPagedItems<SitemapItem>((page, limit) =>
      categoryControllerFindAll({ query: { page, limit } }),
    ),
    collectPagedItems<SitemapItem>((page, limit) =>
      tagControllerFindAll({ query: { page, limit } }),
    ),
    articleControllerGetPublishedArticleIds({
      next: { revalidate: 3600 },
    }).then((response) => response.data?.data ?? []),
    collectPagedItems<SitemapItem>((page, limit) =>
      userControllerFindAll({ query: { page, limit } }),
    ),
  ]);

  const urls: MetadataRoute.Sitemap = [];
  const addPath = (
    path: string,
    options?: Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority" | "lastModified">,
  ) => {
    routing.locales.forEach((locale) => {
      urls.push({
        url: toAbsoluteUrl(locale, path),
        ...options,
      });
    });
  };

  addPath("/", { changeFrequency: "daily", priority: 1 });
  addPath("/topic", { changeFrequency: "weekly", priority: 0.8 });

  categories.forEach((category: SitemapItem) => {
    const children = category.children || [];
    if (children.length > 0) {
      children.forEach((child) => {
        addPath(`/channel/${category.id}/${child.id}`, {
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
      return;
    }

    addPath(`/channel/${category.id}`, {
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  tags.forEach((tag: SitemapItem) => {
    addPath(`/topic/${tag.id}`, {
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  publishedArticles.forEach((article) => {
    addPath(`/article/${article.id}`, {
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: article.updatedAt,
    });
  });

  users.forEach((user: SitemapItem) => {
    addPath(`/account/${user.id}`, {
      changeFrequency: "monthly",
      priority: 0.5,
      lastModified: user.updatedAt || user.createdAt,
    });
  });

  return urls;
}
