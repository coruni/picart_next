"use client";

import { useManualHtmlTranslate } from "@/hooks/useManualHtmlTranslate";
import { Link } from "@/i18n/routing";
import {
  cn,
  formatCompactNumber,
  formatRelativeTime,
  prepareCommentHtmlForDisplay,
} from "@/lib";
import { CommentList } from "@/types";
import { getImageUrls, type ImageInfo } from "@/types/image";
import {
  Image as ImageIcon,
  Languages,
  LoaderCircle,
  MessageCircleMore,
  ThumbsUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { GuardedLink } from "../shared";
import { Avatar } from "../ui/Avatar";
import { CommentEditor } from "./CommentEditor";
import { CommentImageGallery } from "./CommentImageGallery";
export type CommentReply = NonNullable<CommentList[number]["replies"]>[number];

type CommentReplyItemProps = {
  articleId: string;
  rootCommentId: number;
  reply: CommentReply & { images?: (string | ImageInfo)[] };
  isReplyEditorOpen: boolean;
  onToggleReplyEditor: (parentId: number | undefined) => void;
  onToggleLike: (commentId: number | undefined) => void | Promise<void>;
  onReplySubmitted: () => void | Promise<void>;
  onOpenImageViewer: (images: string[], index?: number) => void;
  onOpenModal?: (reply: CommentReply) => void;
  onReplyClick?: (commentId: number) => void;
  imageDisplayMode?: "link" | "gallery";
  showTranslateButton?: boolean;
};

export const CommentReplyItem = memo(function CommentReplyItem({
  articleId,
  rootCommentId,
  reply,
  isReplyEditorOpen,
  onToggleReplyEditor,
  onToggleLike,
  onReplySubmitted,
  onOpenImageViewer,
  onOpenModal,
  onReplyClick,
  imageDisplayMode = "link",
  showTranslateButton = false,
}: CommentReplyItemProps) {
  const tComment = useTranslations("commentList");
  const tAccountInfo = useTranslations("accountInfo");
  const tTime = useTranslations("time");
  const locale = useLocale();

  // 使用 useMemo 缓存翻译和计算结果
  const compactNumberLabels = useMemo(
    () => ({
      thousand: tAccountInfo("numberUnits.thousand"),
      tenThousand: tAccountInfo("numberUnits.tenThousand"),
      hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
      million: tAccountInfo("numberUnits.million"),
      billion: tAccountInfo("numberUnits.billion"),
    }),
    [tAccountInfo],
  );

  const replyTarget = useMemo(() => {
    if (reply.parent && reply.parent.id !== rootCommentId) {
      return {
        id: reply.parent.author?.id,
        name: reply.parent.author?.nickname || reply.parent.author?.username,
      };
    }
    return null;
  }, [reply.parent, rootCommentId]);

  // 缓存内容处理结果
  const replyContentHtml = useMemo(
    () => prepareCommentHtmlForDisplay(reply.content || ""),
    [reply.content],
  );
  const {
    displayHtml,
    isTranslated,
    isTranslating,
    renderKey,
    shouldAutoTranslate,
    toggleTranslate,
    contentMatchesLocale,
  } = useManualHtmlTranslate({
    html: replyContentHtml,
    resetKey: `${reply.id}-${reply.content}`,
  });

  const handleItemClick = useCallback(() => {
    onOpenModal?.(reply);
  }, [onOpenModal, reply]);

  const handleToggleTranslate = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      void toggleTranslate();
    },
    [toggleTranslate],
  );

  const handleOpenReplyEditor = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      // 如果提供了外部 onReplyClick，优先使用它（用于在 Dialog 中打开回复）
      if (onReplyClick) {
        onReplyClick(reply.id);
        return;
      }
      onToggleReplyEditor(reply.id);
    },
    [onReplyClick, onToggleReplyEditor, reply.id],
  );

  const handleToggleLike = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      void onToggleLike(reply.id);
    },
    [onToggleLike, reply.id],
  );

  const handleOpenImageViewer = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const imageUrls = getImageUrls(reply.images || [], "original");
      onOpenImageViewer(imageUrls, 0);
    },
    [onOpenImageViewer, reply.images],
  );

  return (
    <section
      key={reply.id}
      className={cn(onOpenModal && "cursor-pointer")}
      onClick={handleItemClick}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GuardedLink
              href={`/account/${reply.author.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar url={reply.author?.avatar} className="size-5 shrink-0" />
            </GuardedLink>
            <span className="font-semibold text-foreground">
              {reply.author?.nickname || reply.author?.username}
            </span>
          </div>
          {showTranslateButton && !contentMatchesLocale ? (
            <button
              type="button"
              title={tComment("translate")}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-lg p-1 text-secondary transition hover:bg-muted hover:text-primary",
                isTranslated && "bg-muted text-primary",
                isTranslating && "pointer-events-none opacity-70",
              )}
              onClick={handleToggleTranslate}
            >
              {isTranslating ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Languages size={18} />
              )}
            </button>
          ) : null}
        </div>
        <div className="mt-1.5 text-sm">
          {replyTarget?.id && replyTarget.name ? (
            <p className="whitespace-pre-wrap text-sm py-1">
              <span className="text-secondary">
                {tComment("replyToPrefix")}
              </span>{" "}
              <Link
                href={`/account/${replyTarget.id}`}
                className="font-medium text-primary hover:opacity-80"
                onClick={(event) => event.stopPropagation()}
              >
                {replyTarget.name}
              </Link>
              <span className="text-secondary">
                {tComment("replyToSuffix")}
              </span>
              <span
                key={renderKey}
                {...(shouldAutoTranslate
                  ? { "data-auto-translate-comment": true }
                  : {})}
                dangerouslySetInnerHTML={{
                  __html: displayHtml,
                }}
              />
            </p>
          ) : (
            <div
              key={renderKey}
              className="whitespace-pre-wrap text-sm py-1"
              {...(shouldAutoTranslate
                ? { "data-auto-translate-comment": true }
                : {})}
              dangerouslySetInnerHTML={{
                __html: displayHtml,
              }}
            />
          )}
          {reply.images?.length && imageDisplayMode === "gallery" ? (
            <CommentImageGallery
              images={reply.images}
              imageAltPrefix={`Comment reply image ${reply.id}`}
              className="mt-3"
              onOpenImageViewer={(images, index) =>
                onOpenImageViewer(images, index)
              }
            />
          ) : null}
          {reply.images?.length && imageDisplayMode === "link" ? (
            <button
              type="button"
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:opacity-80"
              onClick={handleOpenImageViewer}
            >
              <ImageIcon className="size-4" />
              <span>{tComment("viewImages")}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-secondary text-sm">
        <span className="text-xs">
          {formatRelativeTime(reply?.createdAt, tTime)}
        </span>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className={cn(
              "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
              "cursor-pointer  hover:text-primary",
            )}
            onClick={handleOpenReplyEditor}
          >
            <MessageCircleMore size={20} />
            <span className="text-xs">{tComment("reply")}</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
              "cursor-pointer hover:text-primary",
              reply.isLiked && "text-primary",
            )}
            onClick={handleToggleLike}
          >
            <ThumbsUp size={20} />
            <span className="text-xs">
              {formatCompactNumber(reply?.likes, {
                locale,
                labels: compactNumberLabels,
              })}
            </span>
          </button>
        </div>
      </div>

      {isReplyEditorOpen ? (
        <CommentEditor
          articleId={articleId}
          parentId={reply.id}
          className="px-0 pt-4"
          onSubmitted={onReplySubmitted}
        />
      ) : null}
    </section>
  );
});
