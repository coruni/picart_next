"use client";

import { collectionControllerGetCollectionItems } from "@/api";
import { ArticleCard } from "@/components/article";
import { InfiniteScrollStatus } from "@/components/shared";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import type { CollectionControllerGetCollectionItemsResponse } from "@/api";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

type CollectionItem = NonNullable<
  CollectionControllerGetCollectionItemsResponse["data"]["data"]
>[number];

type CollectionArticleListClientProps = {
  initItems: CollectionItem[];
  initPage: number;
  initTotal: number;
  collectionId: number;
  pageSize?: number;
};

export function CollectionArticleListClient({
  initItems,
  initPage,
  initTotal,
  collectionId,
  pageSize = 10,
}: CollectionArticleListClientProps) {
  const t = useTranslations("articleList");
  const observerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(initItems);
  const [page, setPage] = useState(initPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initItems.length < initTotal);
  const [error, setError] = useState<string | null>(null);

  const articles = useMemo(
    () =>
      items
        .map((item) => item.article)
        .filter((article): article is NonNullable<typeof article> =>
          Boolean(article),
        ),
    [items],
  );

  const loadMoreArticles = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await collectionControllerGetCollectionItems({
        path: { id: collectionId },
        query: {
          page,
          limit: pageSize,
        },
      });

      const newItems =
        (response.data?.data?.data as CollectionItem[] | undefined) || [];

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => [...prev, ...newItems]);
        setPage((prev) => prev + 1);

        const responseTotal = response.data?.data?.meta?.total || initTotal;
        if (items.length + newItems.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load collection articles:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [collectionId, hasMore, initTotal, items.length, loading, page, pageSize, t]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        void loadMoreArticles();
      }
    },
  });

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article as ArticleCardArticle}
          showFollow={false}
        />
      ))}

      <InfiniteScrollStatus
        observerRef={observerRef}
        hasMore={hasMore}
        loading={loading}
        error={error}
        isEmpty={articles.length === 0}
        onRetry={loadMoreArticles}
        loadingText={t("loading")}
        idleText={t("loadMore")}
        retryText={t("retry")}
        allLoadedText={t("allLoaded")}
        emptyText={t("noArticles")}
        loadingClassName="text-secondary"
        idleTextClassName="text-secondary"
        endClassName="text-secondary"
        emptyClassName="text-muted-foreground"
      />
    </div>
  );
}
  type ArticleCardArticle = ComponentProps<typeof ArticleCard>["article"];
