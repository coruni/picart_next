"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CommentCard } from "@/components/comment";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {  UserCommentList } from "@/types";
import { commentControllerGetUserComments } from "@/api";

type CommentListClientProps = {
  initPage: number;
  initTotal: number;
  initComments: UserCommentList;
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
  const observerInstanceRef = useRef<IntersectionObserver | null>(null);

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

  // Set up Intersection Observer
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading) {
          loadMoreComments();
        }
      },
      {
        root: null,
        rootMargin: "100px", // Trigger 100px before the element comes into view
        threshold: 0.1,
      }
    );

    observerInstanceRef.current = observer;
    observer.observe(observerRef.current);

    return () => {
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
      }
    };
  }, [loadMoreComments, hasMore, loading]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
      }
    };
  }, []);

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

      {/* Loading indicator and observer target */}
      {hasMore && (
        <div ref={observerRef} className="flex items-center justify-center py-8">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-secondary text-sm">{t("loading")}</span>
            </div>
          ) : (
            <div className="text-foreground text-sm">{t("loadMore")}</div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={loadMoreComments}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              disabled={loading}
            >
              {t("retry")}
            </button>
          </div>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && comments.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground text-sm">{t("allLoaded")}</div>
        </div>
      )}

      {/* Empty state */}
      {!hasMore && comments.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <p>{t("noComments")}</p>
          </div>
        </div>
      )}
    </div>
  );
};