"use client";

import { commentControllerFindOne } from "@/api";
import {
  DropdownMenu,
  InfiniteScrollStatus,
  type MenuItem,
} from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { useManualHtmlTranslate } from "@/hooks/useManualHtmlTranslate";
import { Link } from "@/i18n/routing";
import {
  cn,
  formatCompactNumber,
  formatRelativeTime,
  prepareCommentHtmlForDisplay,
} from "@/lib";
import { MODAL_IDS, openLoginDialog, openModal } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import { CommentList } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  Languages,
  LoaderCircle,
  MessageCircleMore,
  ThumbsUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { Avatar } from "../ui/Avatar";
import { CommentEditor } from "./CommentEditor";
import { CommentImageGallery } from "./CommentImageGallery";
import { CommentReplyItem, type CommentReply } from "./CommentReplyItem";
import { CommentListSkeleton } from "./CommentSkeleton";

function dedupeRepliesById(
  replies: NonNullable<CommentList[number]["replies"]>,
) {
  const seen = new Set<number>();
  return replies.filter((reply) => {
    if (seen.has(reply.id)) {
      return false;
    }
    seen.add(reply.id);
    return true;
  });
}

type CommentReplyListProps = {
  articleId: string;
  data: CommentList[number];
  activeReplyParentId: number | null;
  onToggleReplyEditor: (parentId: number | undefined) => void;
  onToggleLike: (commentId: number | undefined) => void | Promise<void>;
  onReplySubmitted: () => void | Promise<void>;
  onOpenImageViewer: (
    images: string[],
    index?: number,
    zIndexClassName?: string,
  ) => void;
  onReplyClick?: (commentId: number) => void;
  commentAvatarClassName?: string;
  replyAvatarClassName?: string;
  compact?: boolean;
};

type CommentSortKey = "all" | "hot" | "oldest" | "latest" | "rootOnly";

export function CommentReplyList({
  articleId,
  data,
  activeReplyParentId,
  onToggleReplyEditor,
  onToggleLike,
  onReplySubmitted,
  onOpenImageViewer,
  onReplyClick,
  commentAvatarClassName = "size-10",
  replyAvatarClassName = "size-5",
  compact = false,
}: CommentReplyListProps) {
  const tComment = useTranslations("commentList");
  const tAccountInfo = useTranslations("accountInfo");
  const tTime = useTranslations("time");
  const locale = useLocale();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };
  const observerRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<CommentSortKey>("all");
  const [modalReplies, setModalReplies] = useState<
    NonNullable<CommentList[number]["replies"]>
  >([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSortChanging, setIsSortChanging] = useState(false);
  const visibleReplies = useMemo(
    () => data.replies.slice(0, 2),
    [data.replies],
  );
  const contentHtml = prepareCommentHtmlForDisplay(data.content || "");
  const totalReplies = data.replyCount || data.replies.length;
  const {
    displayHtml: modalDisplayHtml,
    isTranslated: isModalTranslated,
    isTranslating: isModalTranslating,
    renderKey: modalRenderKey,
    shouldAutoTranslate: shouldAutoTranslateModal,
    toggleTranslate: toggleModalTranslate,
    contentMatchesLocale,
  } = useManualHtmlTranslate({
    html: contentHtml,
    resetKey: `${data.id}-${data.content}`,
  });

  const openReplyModal = useCallback((_reply?: CommentReply) => {
    setModalOpen(true);
  }, []);

  const handleSortChange = useCallback(
    (nextSortKey: CommentSortKey) => {
      if (nextSortKey === sortKey) {
        return;
      }

      setIsSortChanging(true);
      setSortKey(nextSortKey);
    },
    [sortKey],
  );

  const sortItems: MenuItem[] = useMemo(
    () => [
      {
        label: tComment("sortOptions.all"),
        onClick: () => handleSortChange("all"),
        className:
          sortKey === "all"
            ? "bg-primary/10! text-primary! hover:bg-primary/10!"
            : undefined,
      },
      {
        label: tComment("sortOptions.hot"),
        onClick: () => handleSortChange("hot"),
        className:
          sortKey === "hot"
            ? "bg-primary/10! text-primary! hover:bg-primary/10!"
            : undefined,
      },
      {
        label: tComment("sortOptions.oldest"),
        onClick: () => handleSortChange("oldest"),
        className:
          sortKey === "oldest"
            ? "bg-primary/10! text-primary! hover:bg-primary/10!"
            : undefined,
      },
      {
        label: tComment("sortOptions.latest"),
        onClick: () => handleSortChange("latest"),
        className:
          sortKey === "latest"
            ? "bg-primary/10! text-primary! hover:bg-primary/10!"
            : undefined,
      },
      {
        label: tComment("sortOptions.rootOnly"),
        onClick: () => handleSortChange("rootOnly"),
        className:
          sortKey === "rootOnly"
            ? "bg-primary/10! text-primary! hover:bg-primary/10!"
            : undefined,
      },
    ],
    [handleSortChange, sortKey, tComment],
  );

  const currentSortLabel = useMemo(
    () =>
      sortKey === "all"
        ? tComment("sortWithCount", { count: total })
        : tComment(`sortOptions.${sortKey}`),
    [sortKey, tComment, total],
  );

  const fetchReplies = useCallback(
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
      const response = await commentControllerFindOne({
        path: { id: String(data.id) },
        query: {
          page: pageToLoad,
          limit: 10,
          sortBy: sortByMap[sortKey],
          ...(sortKey === "rootOnly" && { onlyAuthor: true }),
        },
      });

      return {
        replies: response.data?.data?.data || [],
        total: response.data?.data?.meta?.total || 0,
      };
    },
    [data.id, sortKey],
  );

  const refreshReplies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchReplies(1);
      setModalReplies(
        dedupeRepliesById(
          result.replies as unknown as CommentList[number]["replies"],
        ),
      );
      setTotal(result.total);
      setPage(2);
      setHasMore(result.replies.length < result.total);
    } catch (loadError) {
      console.error("Failed to load comment replies:", loadError);
      setError(tComment("loadFailed"));
    } finally {
      setLoading(false);
      setIsSortChanging(false);
    }
  }, [fetchReplies, tComment]);

  const loadMoreReplies = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchReplies(page);
      const newReplies = result.replies;
      const responseTotal = result.total || total;

      if (newReplies.length === 0) {
        setHasMore(false);
      } else {
        let mergedReplyCount = 0;
        setModalReplies((prev) => {
          const mergedReplies = dedupeRepliesById([
            ...prev,
            ...(newReplies as unknown as CommentList[number]["replies"]),
          ]);
          mergedReplyCount = mergedReplies.length;
          return mergedReplies;
        });
        setPage((prev) => prev + 1);
        if (mergedReplyCount >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more comment replies:", loadError);
      setError(tComment("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [fetchReplies, hasMore, loading, page, tComment, total]);

  const handleReplySubmitted = useCallback(async () => {
    await onReplySubmitted();
    if (modalOpen) {
      await refreshReplies();
    }
  }, [modalOpen, onReplySubmitted, refreshReplies]);

  const handleToggleLike = useCallback(
    async (commentId: number | undefined) => {
      if (!commentId) {
        return;
      }

      let previousLiked = false;
      let previousLikes = 0;
      let foundTarget = false;

      setModalReplies((current) =>
        current.map((reply) => {
          if (reply.id !== commentId) {
            return reply;
          }

          foundTarget = true;
          previousLiked = Boolean(reply.isLiked);
          previousLikes = reply.likes || 0;
          const nextLiked = !previousLiked;
          const nextLikes = Math.max(0, previousLikes + (nextLiked ? 1 : -1));

          return { ...reply, isLiked: nextLiked, likes: nextLikes };
        }),
      );

      try {
        await onToggleLike(commentId);
      } catch (likeError) {
        if (foundTarget) {
          setModalReplies((current) =>
            current.map((reply) =>
              reply.id === commentId
                ? { ...reply, isLiked: previousLiked, likes: previousLikes }
                : reply,
            ),
          );
        }
        throw likeError;
      }
    },
    [onToggleLike],
  );

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    void refreshReplies();
  }, [modalOpen, refreshReplies, sortKey]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    rootRef: scrollRootRef,
    enabled: modalOpen && hasMore,
    onIntersect: () => {
      if (!loading) {
        void loadMoreReplies();
      }
    },
  });

  if (!totalReplies && !data.replies.length) {
    return null;
  }

  return (
    <>
      <div className={cn("mt-3 ml-17 pr-4", !compact && "md:ml-19 md:pr-6")}>
        <div className="pl-3 border-l-3 border-muted text-sm space-y-6">
          {visibleReplies.map((reply) => (
            <CommentReplyItem
              key={reply.id}
              articleId={articleId}
              rootCommentId={data.id}
              reply={reply}
              isReplyEditorOpen={activeReplyParentId === reply.id}
              onToggleReplyEditor={onToggleReplyEditor}
              onToggleLike={onToggleLike}
              onReplySubmitted={onReplySubmitted}
              onOpenImageViewer={onOpenImageViewer}
              onOpenModal={openReplyModal}
              onReplyClick={onReplyClick}
              avatarClassName={replyAvatarClassName}
              compact={compact}
            />
          ))}
        </div>
        {totalReplies > visibleReplies.length ? (
          <button
            type="button"
            className="mt-4 inline-flex h-8 items-center rounded-full bg-muted px-4 text-sm text-secondary transition hover:text-primary"
            onClick={() => openReplyModal()}
          >
            {tComment("totalReplies", { count: totalReplies })}
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogOverlay className="z-400!" />

        <DialogContent className="w-[calc(100vw-1rem)] md:max-w-2xl rounded-xl p-0 z-401! flex flex-col max-h-[85vh] min-h-0">
          <DialogHeader className="px-6 py-4 mb-0!">
            <DialogTitle className="text-sm font-semibold text-left">
              {tComment.has("viewCommentTitle")
                ? tComment("viewCommentTitle", { count: totalReplies })
                : `${tComment("totalReplies", { count: totalReplies })}`}
            </DialogTitle>
          </DialogHeader>
          <div ref={scrollRootRef} className="flex-1 min-h-0 overflow-y-auto">
            <article className={cn("px-4 py-3", !compact && "md:px-6 md:py-5")}>
              <div className="flex items-center space-x-3">
                <Avatar
                  className={commentAvatarClassName}
                  alt={data.author.nickname || data.author.username}
                  url={data.author.avatar}
                  frameUrl={
                    data.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl
                  }
                />
                <div className="grow w-0">
                  <Link
                    className="flex items-center"
                    href={`/account/${data.author.id}`}
                  >
                    <span
                      className={cn(
                        "text-sm leading-5 font-semibold",
                        data.author?.isMember,
                      )}
                    >
                      {data.author.nickname || data.author.username}
                    </span>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(data.createdAt, tTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!contentMatchesLocale && (
                    <button
                      type="button"
                      title={tComment("translate")}
                      className={cn(
                        "flex size-7 cursor-pointer items-center justify-center rounded-lg p-1 text-secondary hover:bg-muted hover:text-primary",
                        isModalTranslated && "bg-muted text-primary",
                        isModalTranslating && "pointer-events-none opacity-70",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModalTranslate();
                      }}
                    >
                      {isModalTranslating ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <Languages size={20} />
                      )}
                    </button>
                  )}
                  <button
                    title={tComment("translate")}
                    className="flex size-7 cursor-pointer items-center justify-center p-1 text-secondary"
                  >
                    <EllipsisVertical size={20} />
                  </button>
                </div>
              </div>
              <div className="py-2">
                {data.author?.equippedDecorations?.COMMENT_BUBBLE ? (
                  <div className="relative mt-5 inline-block max-w-full">
                    {data.author.equippedDecorations.COMMENT_BUBBLE
                      .imageUrl && (
                      <div className="absolute -top-5 right-0 w-40 h-10 overflow-hidden cursor-pointer">
                        <ImageWithFallback
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openModal(MODAL_IDS.COMMENT_BUBBLE, {
                              commentBubbleId:
                                data.author?.equippedDecorations
                                  ?.COMMENT_BUBBLE?.id,
                            });
                          }}
                          src={
                            data.author.equippedDecorations.COMMENT_BUBBLE
                              .imageUrl
                          }
                          alt={
                            data.author.equippedDecorations.COMMENT_BUBBLE
                              .name
                          }
                          fill
                          className="object-contain object-right"
                        />
                      </div>
                    )}
                    <div
                      className="min-w-40 p-4 pt-6 rounded-lg text-sm wrap-break-word"
                      style={{
                        backgroundColor:
                          data.author?.equippedDecorations?.COMMENT_BUBBLE
                            ?.bubbleColor || "",
                      }}
                    >
                      <div
                        key={modalRenderKey}
                        className="whitespace-pre-wrap text-sm wrap-break-word"
                        {...(shouldAutoTranslateModal
                          ? { "data-auto-translate-comment": true }
                          : {})}
                        dangerouslySetInnerHTML={{ __html: modalDisplayHtml }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    key={modalRenderKey}
                    className="whitespace-pre-wrap text-sm"
                    {...(shouldAutoTranslateModal
                      ? { "data-auto-translate-comment": true }
                      : {})}
                    dangerouslySetInnerHTML={{ __html: modalDisplayHtml }}
                  />
                )}
                <CommentImageGallery
                  images={data.images || []}
                  imageAltPrefix={`Comment image ${data.id}`}
                  onOpenImageViewer={(images, index) =>
                    onOpenImageViewer(images, index, "z-500!")
                  }
                  compact={compact}
                  edgePadding={false}
                  contentOffset={false}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-secondary">
                <span className="text-xs">
                  {formatRelativeTime(data.createdAt, tTime)}
                </span>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="flex cursor-pointer items-center space-x-1 py-1 hover:text-primary"
                    onClick={() => {
                      if (!isAuthenticated) {
                        openLoginDialog();
                        return;
                      }
                      onToggleReplyEditor(data.id);
                    }}
                  >
                    <MessageCircleMore size={20} />
                    <span className="text-xs">{tComment("reply")}</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex cursor-pointer items-center space-x-1 py-1 hover:text-primary",
                      data.isLiked && "text-primary",
                    )}
                    onClick={() => {
                      if (!isAuthenticated) {
                        openLoginDialog();
                        return;
                      }
                      void onToggleLike(data.id);
                    }}
                  >
                    <ThumbsUp size={20} />
                    <span className="text-xs">
                      {formatCompactNumber(data.likes, {
                        locale,
                        labels: compactNumberLabels,
                      })}
                    </span>
                  </button>
                </div>
              </div>
              {activeReplyParentId === data.id ? (
                <CommentEditor
                  articleId={articleId}
                  parentId={data.id}
                  className="px-0 pt-4"
                  onSubmitted={handleReplySubmitted}
                />
              ) : null}
            </article>

            <div
              className={cn(
                "mb-2 border-b border-border py-4 min-w-min px-4",
                !compact && "md:px-6",
              )}
            >
              <DropdownMenu
                className="w-fit text-sm"
                position="left"
                title=""
                trigger={({ isOpen }) => (
                  <button className="inline-flex w-fit shrink-0 items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-primary">
                    <span className="w-max">{currentSortLabel}</span>
                    <ChevronDown
                      className={`size-4 text-[#aeb8c7] transition-transform duration-180 ease-out ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
                items={sortItems}
                menuClassName="top-9 min-w-0 rounded-xl border border-border bg-card drop-shadow-lg"
              />
            </div>
            <div className={cn("px-4 py-3", !compact && "md:px-6 md:py-5")}>
              {isSortChanging || (loading && modalReplies.length === 0) ? (
                <CommentListSkeleton count={4} className="space-y-6" />
              ) : (
                <div className="text-sm space-y-6">
                  {modalReplies.map((reply) => (
                    <CommentReplyItem
                      key={`modal-${reply.id}`}
                      articleId={articleId}
                      rootCommentId={data.id}
                      reply={reply}
                      isReplyEditorOpen={activeReplyParentId === reply.id}
                      onToggleReplyEditor={onToggleReplyEditor}
                      onToggleLike={handleToggleLike}
                      onReplySubmitted={handleReplySubmitted}
                      onOpenImageViewer={(images, index) =>
                        onOpenImageViewer(images, index, "z-500!")
                      }
                      imageDisplayMode="gallery"
                      showTranslateButton
                      onReplyClick={onReplyClick}
                      avatarClassName={replyAvatarClassName}
                      compact={compact}
                      showBubble
                    />
                  ))}
                </div>
              )}

              {isSortChanging ? null : (
                <InfiniteScrollStatus
                  observerRef={observerRef}
                  hasMore={hasMore}
                  loading={loading}
                  error={error}
                  isEmpty={modalReplies.length === 0}
                  onRetry={loadMoreReplies}
                  loadingText={tComment("loading")}
                  idleText={tComment("loadMore")}
                  retryText={tComment("retry")}
                  allLoadedText={tComment("allLoaded")}
                  emptyText={tComment("noComments")}
                  containerClassName="py-6"
                  loadingClassName="text-secondary"
                  idleTextClassName="text-secondary"
                  endClassName="text-secondary"
                  emptyClassName="text-muted-foreground"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
