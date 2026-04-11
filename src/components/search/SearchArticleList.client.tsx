"use client";

import { articleControllerSearch } from "@/api";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { usePathname } from "@/i18n/routing";
import { useSearchStore } from "@/stores";
import { ArticleList } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { InfiniteScrollStatus } from "../shared";
import { SearchArticle } from "./SearchArticle";

type SearchArticleListClientProps = {
  initArticles: ArticleList;
  initPage: number;
  initTotal: number;
  keyword: string;
  categoryId?: string;
  pageSize?: number;
  cacheKey?: string;
};

export function SearchArticleListClient({
  initArticles,
  initPage,
  initTotal,
  keyword,
  categoryId,
  pageSize = 20,
  cacheKey,
}: SearchArticleListClientProps) {
  const t = useTranslations("articleList");
  const pathname = usePathname();
  const sort = useSearchStore((state) => state.sort);
  const normalizedKeyword = keyword.trim();
  const normalizedCategoryId = categoryId?.trim() || "";
  const storageKey =
    cacheKey ||
    `search-article-list-${pathname}-${normalizedKeyword}-${normalizedCategoryId}`;
  const scrollKey = `${storageKey}-scroll`;

  const getInitialState = () => {
    if (typeof window === "undefined") {
      return { articles: initArticles, page: initPage };
    }

    const navigationType = (
      performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming
    )?.type;

    if (navigationType === "reload") {
      try {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(scrollKey);
      } catch (error) {
        console.error("Failed to clear search cache on refresh:", error);
      }

      return { articles: initArticles, page: initPage };
    }

    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        const { articles, page, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return { articles, page };
        }
      }
    } catch (error) {
      console.error("Failed to restore search cache:", error);
    }

    return { articles: initArticles, page: initPage };
  };

  const initialState = getInitialState();
  const isPageRefresh = useRef(
    typeof window !== "undefined" &&
      (
        performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming
      )?.type === "reload",
  );
  const observerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(initialState.page);
  const [articles, setArticles] = useState<ArticleList>(initialState.articles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialState.articles.length < initTotal,
  );
  const [error, setError] = useState<string | null>(null);
  const [scrollRestored, setScrollRestored] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    setArticles(initArticles);
    setPage(initPage);
    setHasMore(initArticles.length < initTotal);
    setError(null);
    setScrollRestored(false);
  }, [
    initArticles,
    initPage,
    initTotal,
    normalizedKeyword,
    normalizedCategoryId,
  ]);

  const fetchPage = useCallback(
    async (pageToLoad: number) => {
      if (!normalizedKeyword) {
        return {
          articles: [] as ArticleList,
          total: 0,
        };
      }

      const response = await articleControllerSearch({
        query: {
          keyword: normalizedKeyword,
          page: pageToLoad,
          limit: pageSize,
          ...(normalizedCategoryId && {
            categoryId: Number(normalizedCategoryId),
          }),
          sortBy: sort,
        },
      });

      return {
        articles: response.data?.data?.data || [],
        total: response.data?.data?.meta?.total || 0,
      };
    },
    [normalizedCategoryId, normalizedKeyword, pageSize, sort],
  );

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    const refetchFirstPage = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchPage(1);
        setArticles(result.articles);
        setPage(2);
        setHasMore(result.articles.length < result.total);
        setScrollRestored(false);
      } catch (loadError) {
        console.error("Failed to refresh search articles:", loadError);
        setError(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    void refetchFirstPage();
  }, [fetchPage, t]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          articles,
          page,
          timestamp: Date.now(),
        }),
      );
    } catch (cacheError) {
      console.error("Failed to cache search state:", cacheError);
    }
  }, [articles, page, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      try {
        sessionStorage.setItem(scrollKey, window.scrollY.toString());
      } catch (scrollError) {
        console.error("Failed to save search scroll position:", scrollError);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollKey]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      scrollRestored ||
      isPageRefresh.current
    ) {
      return;
    }

    try {
      const savedScroll = sessionStorage.getItem(scrollKey);
      if (savedScroll) {
        requestAnimationFrame(() => {
          window.scrollTo(0, Number(savedScroll));
          setScrollRestored(true);
        });
      } else {
        setScrollRestored(true);
      }
    } catch (restoreError) {
      console.error("Failed to restore search scroll position:", restoreError);
      setScrollRestored(true);
    }
  }, [scrollKey, scrollRestored]);

  const loadMoreArticles = useCallback(async () => {
    if (loading || !hasMore || !normalizedKeyword) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPage(page);
      const newArticles = result.articles;
      const responseTotal = result.total || initTotal;

      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles((prev) => [...prev, ...newArticles]);
        setPage((prev: number) => prev + 1);
        if (articles.length + newArticles.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more search articles:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    articles.length,
    hasMore,
    initTotal,
    loading,
    normalizedKeyword,
    page,
    fetchPage,
    t,
  ]);

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
    <div className="space-y-1">
      {articles.map((article, index) => (
        <SearchArticle
          key={article.id}
          article={article}
          border={index < articles.length - 1}
          keyword={normalizedKeyword}
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
