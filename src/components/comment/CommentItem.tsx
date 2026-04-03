"use client";

import { commentControllerLike } from "@/api";
import { ImageViewer } from "@/components/article/ImageViewer";
import { useManualHtmlTranslate } from "@/hooks/useManualHtmlTranslate";
import { Link } from "@/i18n/routing";
import {
  cn,
  formatCompactNumber,
  formatRelativeTime,
  prepareCommentHtmlForDisplay,
} from "@/lib";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import { CommentList } from "@/types";
import { type ImageInfo } from "@/types/image";
import {
  EllipsisVertical,
  Languages,
  LoaderCircle,
  MessageCircleMore,
  ThumbsUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";
import { Avatar } from "../ui/Avatar";
import { CommentEditor } from "./CommentEditor";
import { CommentImageGallery } from "./CommentImageGallery";
import { CommentReplyList } from "./CommentReplyList";

type CommentItemProps = {
  articleId: string;
  data: CommentList[number] & { images?: (string | ImageInfo)[] };
  onSubmitted?: () => void | Promise<void>;
};
export const CommentItem = memo(function CommentItem({
  articleId,
  data,
  onSubmitted,
}: CommentItemProps) {
  const tComment = useTranslations("commentList");
  const tAccountInfo = useTranslations("accountInfo");
  const tTime = useTranslations("time");
  const locale = useLocale();
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [commentState, setCommentState] = useState(data);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [activeReplyParentId, setActiveReplyParentId] = useState<number | null>(
    null,
  );
  const contentHtml = prepareCommentHtmlForDisplay(commentState.content || "");
  const {
    displayHtml,
    isTranslated,
    isTranslating,
    renderKey,
    shouldAutoTranslate,
    toggleTranslate,
  } = useManualHtmlTranslate({
    html: contentHtml,
    resetKey: `${commentState.id}-${commentState.content}`,
  });

  useEffect(() => {
    setCommentState(data);
  }, [data]);

  const openImageViewer = useCallback((images: string[], index: number = 0) => {
    if (!images.length) {
      return;
    }

    setViewerImages(images);
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  const toggleReplyEditor = useCallback((parentId: number | undefined) => {
    if (!parentId) {
      return;
    }

    setActiveReplyParentId((current) =>
      current === parentId ? null : parentId,
    );
  }, []);

  const handleReplySubmitted = useCallback(async () => {
    setActiveReplyParentId(null);
    await onSubmitted?.();
  }, [onSubmitted]);

  const handleToggleLike = useCallback(
    async (commentId: number | undefined) => {
      if (!commentId) return;

      if (!isAuthenticated) {
        openLoginDialog();
        return;
      }

      const targetIsMain = commentState.id === commentId;
      const targetReply = commentState.replies.find(
        (reply) => reply.id === commentId,
      );
      const previousLiked = targetIsMain
        ? Boolean(commentState.isLiked)
        : Boolean(targetReply?.isLiked);
      const previousLikes = targetIsMain
        ? commentState.likes || 0
        : targetReply?.likes || 0;
      const nextLiked = !previousLiked;
      const nextLikes = Math.max(0, previousLikes + (nextLiked ? 1 : -1));

      setCommentState((current) =>
        current.id === commentId
          ? { ...current, isLiked: nextLiked, likes: nextLikes }
          : {
              ...current,
              replies: current.replies.map((reply) =>
                reply.id === commentId
                  ? { ...reply, isLiked: nextLiked, likes: nextLikes }
                  : reply,
              ),
            },
      );

      try {
        await commentControllerLike({
          path: { id: String(commentId) },
        });
      } catch (error) {
        setCommentState((current) =>
          current.id === commentId
            ? { ...current, isLiked: previousLiked, likes: previousLikes }
            : {
                ...current,
                replies: current.replies.map((reply) =>
                  reply.id === commentId
                    ? { ...reply, isLiked: previousLiked, likes: previousLikes }
                    : reply,
                ),
              },
        );
        console.error("Failed to like comment:", error);
      }
    },
    [
      commentState.id,
      commentState.isLiked,
      commentState.likes,
      commentState.replies,
      isAuthenticated,
    ],
  );

  return (
    <article>
      {/* User Info element */}
      <div className="px-6 py-1 flex items-center space-x-3">
        <Avatar
          className="size-10"
          alt={data.author.nickname || data.author.username}
          url={data.author.avatar}
          frameUrl={data.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
        />
        <div className="grow w-0">
          <Link
            className="flex items-center"
            href={`/account/${commentState.author.id}`}
          >
            <span className="text-sm leading-5 font-semibold">
              {commentState.author.nickname || commentState.author.username}
            </span>
          </Link>
          <span className="text-xs flex-1 text-muted-foreground">
            {formatRelativeTime(commentState.createdAt, tTime)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            title={tComment("translate")}
            className={cn(
              "flex items-center justify-center outline-none focus:outline-0 border-0",
              "cursor-pointer p-1 hover:bg-muted rounded-lg text-secondary size-7",
              "hover:text-primary",
              isTranslated && "text-primary bg-muted",
              isTranslating && "pointer-events-none opacity-70",
            )}
            onClick={toggleTranslate}
          >
            {isTranslating ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Languages size={20} />
            )}
          </button>
          <button
            title={tComment("translate")}
            className={cn(
              "flex items-center justify-center outline-none text-secondary focus:outline-0 border-0",
              "cursor-pointer p-1 font-semibold size-7",
            )}
          >
            <EllipsisVertical size={20} />
          </button>
        </div>
      </div>

      {/* Comment Content element */}
      <div className="py-2">
        <div className="pl-19 pr-6">
          <div
            key={renderKey}
            className="whitespace-pre-wrap text-sm"
            {...(shouldAutoTranslate
              ? { "data-auto-translate-comment": true }
              : {})}
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        </div>
        <CommentImageGallery
          images={commentState.images || []}
          imageAltPrefix={`Comment image ${commentState.id}`}
          className="mt-3 pl-19 pr-6"
          prevButtonClassName="left-21"
          onOpenImageViewer={openImageViewer}
        />
      </div>
      {/* Comment Actions element */}
      <div className="pl-19 pr-6">
        <div className="flex items-center justify-between text-secondary text-sm mt-2">
          <span className="text-xs">
            {formatRelativeTime(commentState.createdAt, tTime)}
          </span>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className={cn(
                "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                "cursor-pointer py-1 hover:text-primary",
              )}
              onClick={() => toggleReplyEditor(commentState.id)}
            >
              <MessageCircleMore size={20} />
              <span className="text-xs">{tComment("reply")}</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                "cursor-pointer py-1 hover:text-primary",
                commentState.isLiked && "text-primary",
              )}
              onClick={() => void handleToggleLike(commentState.id)}
            >
              <ThumbsUp size={20} />
              <span className="text-xs">
                {formatCompactNumber(commentState.likes, {
                  locale,
                  labels: compactNumberLabels,
                })}
              </span>
            </button>
          </div>
        </div>
        {activeReplyParentId === commentState.id ? (
          <CommentEditor
            articleId={articleId}
            parentId={commentState.id}
            className="px-0 pt-4"
            onSubmitted={handleReplySubmitted}
          />
        ) : null}
      </div>
      {/* Replies element */}
      <CommentReplyList
        articleId={articleId}
        data={commentState}
        activeReplyParentId={activeReplyParentId}
        onToggleReplyEditor={toggleReplyEditor}
        onToggleLike={handleToggleLike}
        onReplySubmitted={handleReplySubmitted}
        onOpenImageViewer={openImageViewer}
      />
      {viewerVisible && viewerImages.length > 0 && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          onChange={setViewerIndex}
          enableSidePanel={false}
        />
      )}
    </article>
  );
});
