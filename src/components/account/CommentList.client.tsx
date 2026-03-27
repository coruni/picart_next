"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CommentCard } from "@/components/comment";
import { useTranslations } from "next-intl";
import {  CommentList, UserCommentList } from "@/types";
import { commentControllerGetUserComments } from "@/api";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { InfiniteScrollStatus } from "@/components/shared";

type CommentListClientProps = {
  initPage: number;
  initTotal: number;
  initComments: UserCommentList|CommentList;
  id: string;

  /**
   * 每页加载数量
   */
  pageSize?: number;
  /**
   * 点赞评论的回调
   */
  onLikeComment?: (commentId: number) => void;
  /**
   * 回复评论的回调
   */
  onReplyComment?: (commentId: number) => void;
};

export const CommentListClient = ({
  initPage,
  initComments,
  initTotal,
  id,
  pageSize = 10,
  onLikeComment,
  onReplyComment
}: CommentListClientProps) => {
  const t = useTranslations("commentList");
  const [page, setPage] = useState(initPage);
  const [comments, setComments] = useState<UserCommentList>(initComments);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initComments.length < initTotal);
  const [error, setError] = useState<string | null>(null);

  // Intersection Observer ref
  const observerRef = useRef<HTMLDivElement>(null);

  // Load more comments function
  const loadMoreComments = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await commentControllerGetUserComments({
        path: {
          userId: id
        },
        query: {
          limit: pageSize,
          page: page,
        }
      });

      if (response.data?.data?.data) {
        const newComments = response.data.data.data;

        if (newComments.length === 0) {
          setHasMore(false);
        } else {
          setComments((prev) => [...prev, ...newComments]);
          setPage(page+1);

          // Check if we've loaded all comments based on total from response
          const responseTotal = response.data.data.meta?.total || initTotal;
          const totalLoaded = comments.length + newComments.length;
          if (totalLoaded >= responseTotal) {
            setHasMore(false);
          }
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more comments:", err);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, comments.length, initTotal, pageSize, t]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        loadMoreComments();
      }
    },
  });

  // Handle comment like
  const handleLikeComment = (commentId: number) => {
    onLikeComment?.(commentId);
  };

  // Handle comment reply
  const handleReplyComment = (commentId: number) => {
    onReplyComment?.(commentId);
  };

  return (
    <div className="space-y-6">
      {/* Comment list */}
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onLike={handleLikeComment}
          onReply={handleReplyComment}
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
        idleTextClassName="text-foreground"
        endClassName="text-muted-foreground"
        emptyClassName="text-muted-foreground"
      />
    </div>
  );
};
