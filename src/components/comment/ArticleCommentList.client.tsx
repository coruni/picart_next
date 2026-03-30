"use client";

import { commentControllerFindAll } from "@/api";
import { InfiniteScrollStatus } from "@/components/shared";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { CommentList } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommentEditor } from "./CommentEditor";
import { CommentItem } from "./CommentItem";
import { CommentListSkeleton } from "./CommentSkeleton";

type ArticleCommentListProps = {
  articleId: string;
  pageSize?: number;
};

export function ArticleCommentList({
  articleId,
  pageSize = 10,
}: ArticleCommentListProps) {
  const t = useTranslations("commentList");
  const observerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [comments, setComments] = useState<CommentList>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(
    async (pageToLoad: number) => {
      const response = await commentControllerFindAll({
        path: { id: articleId },
        query: {
          page: pageToLoad,
          limit: pageSize,
        },
      });

      return {
        comments: response.data?.data?.data || [],
        total: response.data?.data?.meta?.total || 0,
      };
    },
    [articleId, pageSize],
  );

  // 初始化加载
  const refreshComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchComments(1);
      setComments(result.comments);
      setTotal(result.total);
      setPage(2);
      setHasMore(result.comments.length < result.total);
    } catch (loadError) {
      console.error("Failed to load comments:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [fetchComments, t]);

  useEffect(() => {
    void refreshComments();
  }, [refreshComments]);

  const loadMoreComments = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchComments(page);
      const newComments = result.comments;
      const responseTotal = result.total || total;

      if (newComments.length === 0) {
        setHasMore(false);
      } else {
        setComments((prev: CommentList) => [...prev, ...newComments]);
        setPage((prev: number) => prev + 1);
        if (comments.length + newComments.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more comments:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, comments.length, total, fetchComments, t]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        void loadMoreComments();
      }
    },
  });

  // 初始化加载动画
  if (loading && comments.length === 0) {
    return (
      <div className="space-y-4">
        <CommentEditor articleId={articleId} onSubmitted={refreshComments} />
        <CommentListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CommentEditor articleId={articleId} onSubmitted={refreshComments} />

      {comments.map((comment) => (
        <CommentItem data={comment} key={comment.id} />
      ))}

      <InfiniteScrollStatus
        observerRef={observerRef}
        hasMore={hasMore}
        loading={loading}
        error={error}
        isEmpty={comments.length === 0}
        onRetry={loadMoreComments}
        loadingText={t("loading")}
        idleText={t("loadMore")}
        retryText={t("retry")}
        allLoadedText={t("allLoaded")}
        emptyText={t("noComments")}
        loadingClassName="text-secondary"
        idleTextClassName="text-secondary"
        endClassName="text-secondary"
        emptyClassName="text-muted-foreground"
      />
    </div>
  );
}
