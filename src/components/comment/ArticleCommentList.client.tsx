"use client";

import { commentControllerFindAll } from "@/api";
import {
  DropdownMenu,
  InfiniteScrollStatus,
  type MenuItem,
} from "@/components/shared";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { cn } from "@/lib";
import { CommentList } from "@/types";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { CommentItem } from "./CommentItem";
import { CommentListSkeleton } from "./CommentSkeleton";

// 延迟加载 CommentEditor，减少初始包大小
const CommentEditor = dynamic(
  () => import("./CommentEditor").then((mod) => mod.CommentEditor),
  {
    ssr: false,
    loading: () => <div className="h-32 animate-pulse bg-muted rounded-lg" />,
  },
);

// 使用 memo 优化 CommentItem 重渲染
const MemoizedCommentItem = memo(CommentItem);

type ArticleCommentListProps = {
  articleId: string;
  pageSize?: number;
  commentCount?: number;
  showTopCommentEditor?: boolean;
  stickySort?: boolean;
  sortClassName?: string;
  onSubmitted?: () => void;
  onReplyClick?: (commentId: number) => void;
  commentAvatarClassName?: string;
  replyAvatarClassName?: string;
  compact?: boolean;
};

type CommentSortKey = "all" | "hot" | "oldest" | "latest" | "rootOnly";

export function ArticleCommentList({
  articleId,
  pageSize = 10,
  commentCount,
  showTopCommentEditor = true,
  stickySort = false,
  sortClassName,
  onSubmitted,
  onReplyClick,
  commentAvatarClassName,
  replyAvatarClassName,
  compact = false,
}: ArticleCommentListProps) {
  const t = useTranslations("commentList");
  const observerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [comments, setComments] = useState<CommentList>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<CommentSortKey>("all");
  const [isSortChanging, setIsSortChanging] = useState(false);

  const fetchComments = useCallback(
    async (pageToLoad: number) => {
      const sortByMap: Record<
        CommentSortKey,
        "hot" | "oldest" | "latest" | undefined
      > = {
        all: undefined,
        hot: "hot",
        oldest: "oldest",
        latest: "latest",
        rootOnly: undefined,
      };
      const response = await commentControllerFindAll({
        path: { id: articleId },
        query: {
          page: pageToLoad,
          limit: pageSize,
          sortBy: sortByMap[sortKey],
          ...(sortKey === "rootOnly" && { onlyAuthor: true }),
        },
      });

      return {
        comments: response.data?.data?.data || [],
        total: response.data?.data?.meta?.total || 0,
      };
    },
    [articleId, pageSize, sortKey],
  );

  // 防抖的刷新函数
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshComments = useCallback(async () => {
    // 清除之前的防抖计时器
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // 设置新的防抖计时器
    refreshTimeoutRef.current = setTimeout(async () => {
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
        setIsSortChanging(false);
        onSubmitted?.();
      }
    }, 100);
  }, [fetchComments, onSubmitted, t]);

  // 清理防抖计时器
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // 初始化加载
  useEffect(() => {
    void refreshComments();
  }, []);

  // 排序变化时重新加载
  useEffect(() => {
    void refreshComments();
  }, [sortKey]);

  const handleSortChange = (nextSortKey: CommentSortKey) => {
    if (nextSortKey === sortKey) {
      return;
    }

    setIsSortChanging(true);
    setSortKey(nextSortKey);
  };

  const sortItems: MenuItem[] = [
    {
      label: t("sortOptions.all"),
      onClick: () => handleSortChange("all"),
      className:
        sortKey === "all"
          ? "bg-primary/10! text-primary! hover:bg-primary/10!"
          : undefined,
    },
    {
      label: t("sortOptions.hot"),
      onClick: () => handleSortChange("hot"),
      className:
        sortKey === "hot"
          ? "bg-primary/10! text-primary! hover:bg-primary/10!"
          : undefined,
    },
    {
      label: t("sortOptions.oldest"),
      onClick: () => handleSortChange("oldest"),
      className:
        sortKey === "oldest"
          ? "bg-primary/10! text-primary! hover:bg-primary/10!"
          : undefined,
    },
    {
      label: t("sortOptions.latest"),
      onClick: () => handleSortChange("latest"),
      className:
        sortKey === "latest"
          ? "bg-primary/10! text-primary! hover:bg-primary/10!"
          : undefined,
    },
    {
      label: t("sortOptions.rootOnly"),
      onClick: () => handleSortChange("rootOnly"),
      className:
        sortKey === "rootOnly"
          ? "bg-primary/10! text-primary! hover:bg-primary/10!"
          : undefined,
    },
  ];

  const currentSortLabel =
    sortKey === "all"
      ? t("sortWithCount", { count: commentCount ?? total })
      : t(`sortOptions.${sortKey}`);

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
        {showTopCommentEditor && (
          <CommentEditor articleId={articleId} onSubmitted={refreshComments} />
        )}
        <div
          className={cn(
            "border-b border-border px-6 pb-4",
            compact && "px-4",
            stickySort && "sticky top-0 z-10 bg-card",
          )}
        >
          <DropdownMenu
            className="w-fit"
            position="left"
            title=""
            trigger={({ isOpen }) => (
              <button className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-primary">
                <span>{currentSortLabel}</span>
                <ChevronDown
                  className={`size-4 text-[#aeb8c7] transition-transform duration-180 ease-out ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
            items={sortItems}
            menuClassName="top-9 min-w-0 rounded-2xl border border-border bg-card drop-shadow-lg"
          />
        </div>
        <CommentListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTopCommentEditor && (
        <CommentEditor articleId={articleId} onSubmitted={refreshComments} />
      )}

      <div
        className={cn(
          "border-b border-border px-4 pb-4 min-w-min",
          !compact && "mmd:px-6",
          stickySort && "sticky top-0 z-10 bg-card",
          sortClassName,
        )}
      >
        <DropdownMenu
          className="w-fit text-sm "
          position="left"
          title=""
          trigger={({ isOpen }) => (
            <button className="inline-flex shrink-0 w-fit items-center gap-1.5 text-sm  text-muted-foreground font-semibold transition hover:text-primary">
              <span className=" w-max">{currentSortLabel}</span>
              <ChevronDown
                className={`size-4 transition-transform duration-180 ease-out ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
          items={sortItems}
          menuClassName="top-9 min-w-0 max-w rounded-xl border border-border bg-card drop-shadow-lg"
        />
      </div>

      {isSortChanging ? (
        <CommentListSkeleton />
      ) : (
        <>
          {comments.map((comment) => (
            <MemoizedCommentItem
              articleId={articleId}
              data={comment}
              key={comment.id}
              onSubmitted={refreshComments}
              onReplyClick={onReplyClick}
              commentAvatarClassName={commentAvatarClassName}
              replyAvatarClassName={replyAvatarClassName}
              compact={compact}
            />
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
        </>
      )}
    </div>
  );
}
