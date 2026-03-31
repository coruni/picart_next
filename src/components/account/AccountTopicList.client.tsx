"use client";

import { tagControllerFollowedList } from "@/api";
import { InfiniteScrollStatus } from "@/components/shared";
import { TopicCard } from "@/components/topic/TopicCard";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { TagList } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

type AccountTopicListClientProps = {
  initTags: TagList;
  initPage: number;
  initTotal: number;
  userId: number;
  pageSize?: number;
};

export function AccountTopicListClient({
  initTags,
  initPage,
  initTotal,
  userId,
  pageSize = 10,
}: AccountTopicListClientProps) {
  const t = useTranslations("tagList");
  const observerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(initPage);
  const [tags, setTags] = useState<TagList>(initTags);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initTags.length < initTotal);
  const [error, setError] = useState<string | null>(null);

  const loadMoreTags = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await tagControllerFollowedList({
        query: {
          page,
          limit: pageSize,
          userId,
        },
      });

      const newTags = ((response.data?.data?.data as TagList | undefined) || []);

      if (newTags.length === 0) {
        setHasMore(false);
      } else {
        setTags((prev) => [...prev, ...newTags]);
        setPage((prev) => prev + 1);

        const responseTotal = response.data?.data?.meta?.total || initTotal;
        if (tags.length + newTags.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more account topics:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [hasMore, initTotal, loading, page, pageSize, t, tags.length, userId]);

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
