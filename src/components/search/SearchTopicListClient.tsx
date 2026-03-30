"use client";

import { tagControllerFindAll } from "@/api";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { usePathname } from "@/i18n/routing";
import { TagList } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { InfiniteScrollStatus } from "../shared";
import { TopicCard } from "../topic/TopicCard";

type SearchTopicListClientProps = {
  initTags: TagList;
  initPage: number;
  initTotal: number;
  keyword: string;
  pageSize?: number;
  cacheKey?: string;
};

export function SearchTopicListClient({
  initTags,
  initPage,
  initTotal,
  keyword,
  pageSize = 10,
  cacheKey,
}: SearchTopicListClientProps) {
  const t = useTranslations("tagList");
  const pathname = usePathname();
  const normalizedKeyword = keyword.trim();
  const storageKey =
    cacheKey || `search-topic-list-${pathname}-${normalizedKeyword}`;
  const scrollKey = `${storageKey}-scroll`;

  const getInitialState = () => {
    if (typeof window === "undefined") {
      return { tags: initTags, page: initPage };
    }

    const navigationType = (
      performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    )?.type;

    if (navigationType === "reload") {
      try {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(scrollKey);
      } catch (error) {
        console.error("Failed to clear search cache on refresh:", error);
      }

      return { tags: initTags, page: initPage };
    }

    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        const { tags, page, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return { tags, page };
        }
      }
    } catch (error) {
      console.error("Failed to restore search cache:", error);
    }

    return { tags: initTags, page: initPage };
  };

  const initialState = getInitialState();
  const isPageRefresh = useRef(
    typeof window !== "undefined" &&
      (
        performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      )?.type === "reload",
  );
  const observerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(initialState.page);
  const [tags, setTags] = useState<TagList>(initialState.tags);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialState.tags.length < initTotal);
  const [error, setError] = useState<string | null>(null);
  const [scrollRestored, setScrollRestored] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    setTags(initTags);
    setPage(initPage);
    setHasMore(initTags.length < initTotal);
    setError(null);
    setScrollRestored(false);
  }, [initTags, initPage, initTotal, normalizedKeyword]);

  const fetchPage = useCallback(
    async (pageToLoad: number) => {
      if (!normalizedKeyword) {
        return {
          tags: [] as TagList,
          total: 0,
        };
      }

      const response = await tagControllerFindAll({
        query: {
          name: normalizedKeyword,
          page: pageToLoad,
          limit: pageSize,
        },
      });

      return {
        tags: response.data?.data?.data || [],
        total: response.data?.data?.meta?.total || 0,
      };
    },
    [normalizedKeyword, pageSize],
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
        setTags(result.tags);
        setPage(2);
        setHasMore(result.tags.length < result.total);
        setScrollRestored(false);
      } catch (loadError) {
        console.error("Failed to refresh search topics:", loadError);
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
          tags,
          page,
          timestamp: Date.now(),
        }),
      );
    } catch (cacheError) {
      console.error("Failed to cache search state:", cacheError);
    }
  }, [tags, page, storageKey]);

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
    if (typeof window === "undefined" || scrollRestored || isPageRefresh.current) {
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

  const loadMoreTags = useCallback(async () => {
    if (loading || !hasMore || !normalizedKeyword) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPage(page);
      const newTags = result.tags;
      const responseTotal = result.total || initTotal;

      if (newTags.length === 0) {
        setHasMore(false);
      } else {
        setTags((prev) => [...prev, ...newTags]);
        setPage((prev: number) => prev + 1);
        if (tags.length + newTags.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more search topics:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    tags.length,
    hasMore,
    initTotal,
    loading,
    normalizedKeyword,
    page,
    pageSize,
    fetchPage,
    t,
  ]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        void loadMoreTags();
      }
    },
  });

  return (
    <div className="space-y-1">
      {tags.map((tag, index) => (
        <TopicCard
          key={tag.id}
          tag={tag}
          showAvatar
          loading={index < 3 ? "eager" : "lazy"}
        />
      ))}

      <InfiniteScrollStatus
        observerRef={observerRef}
        hasMore={hasMore}
        loading={loading}
        error={error}
        isEmpty={tags.length === 0}
        onRetry={loadMoreTags}
        loadingText={t("loading")}
        idleText={t("loadMore")}
        retryText={t("retry")}
        allLoadedText={t("allLoaded")}
        emptyText={t("noTags")}
        loadingClassName="text-secondary"
        idleTextClassName="text-secondary"
        endClassName="text-muted-foreground"
        emptyClassName="text-muted-foreground"
      />
    </div>
  );
}