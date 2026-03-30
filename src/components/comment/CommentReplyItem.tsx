"use client";
"use client";

import { useManualHtmlTranslate } from "@/hooks/useManualHtmlTranslate";
import { Link } from "@/i18n/routing";
import { cn, prepareCommentHtmlForDisplay } from "@/lib";
import { CommentList } from "@/types";
import {
  Image as ImageIcon,
  Languages,
  LoaderCircle,
  MessageCircleMore,
  ThumbsUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "../ui/Avatar";
import { CommentEditor } from "./CommentEditor";
import { CommentImageGallery } from "./CommentImageGallery";
export type CommentReply = NonNullable<CommentList[number]["replies"]>[number];

type CommentReplyItemProps = {
  articleId: string;
  rootCommentId: number;
  reply: CommentReply;
  isReplyEditorOpen: boolean;
  onToggleReplyEditor: (parentId: number | undefined) => void;
  onToggleLike: (commentId: number | undefined) => void | Promise<void>;
  onReplySubmitted: () => void | Promise<void>;
  onOpenImageViewer: (images: string[], index?: number) => void;
  onOpenModal?: (reply: CommentReply) => void;
  imageDisplayMode?: "link" | "gallery";
  showTranslateButton?: boolean;
};

export function CommentReplyItem({
  articleId,
  rootCommentId,
  reply,
  isReplyEditorOpen,
  onToggleReplyEditor,
  onToggleLike,
  onReplySubmitted,
  onOpenImageViewer,
  onOpenModal,
  imageDisplayMode = "link",
  showTranslateButton = false,
}: CommentReplyItemProps) {
  const tComment = useTranslations("commentList");
  const replyTarget =
    reply.parent && reply.parent.id !== rootCommentId
      ? {
          id: reply.parent.author?.id,
          name: reply.parent.author?.nickname || reply.parent.author?.username,
        }
      : null;
  const replyContentHtml = prepareCommentHtmlForDisplay(reply.content || "");
  const {
    displayHtml,
    isTranslated,
    isTranslating,
    toggleTranslate,
  } = useManualHtmlTranslate({
    html: replyContentHtml,
    resetKey: `${reply.id}-${reply.content}`,
  });

  const handleItemClick = () => {
    onOpenModal?.(reply);
  };

  return (
    <section
      key={reply.id}
      className={cn(onOpenModal && "cursor-pointer")}
      onClick={handleItemClick}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Avatar url={reply.author?.avatar} className="size-5 shrink-0" />
            <span className="font-semibold text-foreground">
              {reply.author?.nickname || reply.author?.username}
            </span>
          </div>
          {showTranslateButton ? (
            <button
              type="button"
              title={tComment("translate")}
              className={cn(
              "flex size-7 cursor-pointer items-center justify-center rounded-lg p-1 text-secondary transition hover:bg-muted hover:text-primary",
              isTranslated && "bg-muted text-primary",
              isTranslating && "pointer-events-none opacity-70",
            )}
              onClick={(event) => {
                event.stopPropagation();
                toggleTranslate();
              }}
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
                data-auto-translate-content
                dangerouslySetInnerHTML={{
                  __html: displayHtml,
                }}
              />
            </p>
          ) : (
            <div
              className="whitespace-pre-wrap text-sm py-1"
              data-auto-translate-content
              dangerouslySetInnerHTML={{
                __html: displayHtml,
              }}
            />
          )}
          {reply.images?.length && imageDisplayMode === "gallery" ? (
            <CommentImageGallery
              images={reply.images || []}
              imageAltPrefix={`Comment reply image ${reply.id}`}
              className="mt-3"
              onOpenImageViewer={onOpenImageViewer}
            />
          ) : null}
          {reply.images?.length && imageDisplayMode === "link" ? (
            <button
              type="button"
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:opacity-80"
              onClick={(event) => {
                event.stopPropagation();
                onOpenImageViewer(reply.images || [], 0);
              }}
            >
              <ImageIcon className="size-4" />
              <span>{tComment("viewImages")}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-secondary text-sm">
        <span className="text-xs">
          {new Date(reply?.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className={cn(
              "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
              "cursor-pointer  hover:text-primary",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleReplyEditor(reply.id);
            }}
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
            onClick={(event) => {
              event.stopPropagation();
              void onToggleLike(reply.id);
            }}
          >
            <ThumbsUp size={20} />
            <span className="text-xs">{reply?.likes}</span>
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
}
