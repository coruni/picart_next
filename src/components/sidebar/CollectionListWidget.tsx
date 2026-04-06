"use client";

import { CollectionControllerGetCollectionItemsResponse } from "@/api";
import { collectionControllerGetCollectionItems } from "@/api/sdk.gen";
import { Link } from "@/i18n/routing";
import { getImageUrl } from "@/types/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../shared/ImageWithFallback";

type CollectionArticleItem =
  CollectionControllerGetCollectionItemsResponse["data"]["data"][number];

interface CollectionListWidgetProps {
  collectionId: number;
  userId: number | string;
  collectionName?: string;
  currentArticleId?: number;
}

export const CollectionListWidget = ({
  collectionId,
  collectionName,
  userId,
  currentArticleId,
}: CollectionListWidgetProps) => {
  const t = useTranslations("sidebar");
  const tc = useTranslations("accountCollectionList");
  const [articles, setArticles] = useState<CollectionArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCollectionItems = async () => {
      try {
        const response = await collectionControllerGetCollectionItems({
          path: { id: collectionId },
          query: {
            limit: 6,
            page: 1,
          },
        });

        if (response.data?.data?.data) {
          const items = response.data.data.data;
          // Filter out current article
          const filtered = currentArticleId
            ? items.filter((item) => item.articleId !== currentArticleId)
            : items;
          setArticles(filtered);
          setTotal(response.data.data.meta?.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch collection items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionItems();
  }, [collectionId, currentArticleId]);

  if (loading) {
    return (
      <section className="rounded-xl bg-card px-2 py-4">
        <div className="mb-3 px-2">
          <div className="line-clamp-1 overflow-hidden text-ellipsis leading-6 font-semibold">
            <span>{t("collectionArticles")}</span>
          </div>
        </div>
        <div className="animate-pulse space-y-2 px-2">
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  const hasMore = total > articles.length;

  return (
    <section className="rounded-xl bg-card px-2 py-4">
      {/* Header */}
      <div className="mb-3 px-2">
        <div className="line-clamp-1 overflow-hidden text-ellipsis leading-6 font-semibold">
          <span>{t("collectionArticles")}</span>
        </div>
      </div>

      {/* Article List */}
      <div className="space-y-3">
        {articles.map((item) => (
          <article key={item.id}>
            <Link
              href={`/article/${item.articleId}`}
              className="group flex items-center gap-3 hover:bg-primary/15 p-2 rounded-md"
            >
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors line-clamp-2">
                  {item.article?.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(item.article?.views || 0).toLocaleString()}
                  {tc("views")}
                </p>
              </div>

              {/* Thumbnail */}
              <div className="relative w-24 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                <ImageWithFallback
                  src={
                    item.article?.cover ||
                    getImageUrl(item.article.images?.[0], "small") ||
                    item.article.images?.[0].url
                  }
                  alt={item.article?.title || ""}
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* Footer - View More */}
      {hasMore && (
        <div className="px-2 mt-3">
          <Link
            href={`/account/${userId}/collection/${collectionId}`}
            className="text-sm text-primary hover:text-primary/80 cursor-pointer"
          >
            {t("viewMoreArticles")}
          </Link>
        </div>
      )}
    </section>
  );
};
