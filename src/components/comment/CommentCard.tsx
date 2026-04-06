"use client";

import { useManualHtmlTranslate } from "@/hooks/useManualHtmlTranslate";
import { Link } from "@/i18n/routing";
import {
  cn,
  formatCompactNumber,
  prepareCommentHtmlForDisplay,
  sanitizeHtmlForRender,
} from "@/lib";
import { formatRelativeTime } from "@/lib/utils";
import { CommentList, UserCommentList } from "@/types";
import { getImageUrl, type ImageInfo } from "@/types/image";
import {
  Languages,
  LoaderCircle,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { Avatar } from "../ui/Avatar";

interface CommentCardProps {
  comment: UserCommentList[number];
  onLike?: (commentId: number) => void;
  onReply?: (commentId: number) => void;
  showReplies?: boolean;
  isReply?: boolean;
  className?: string;
}

export function CommentCard({
  comment,
  onLike,
  onReply,
  showReplies: _showReplies = true,
  isReply: _isReply = false,
  className,
}: CommentCardProps) {
  const t = useTranslations("time");
  const tAccountInfo = useTranslations("accountInfo");
  const locale = useLocale();
  const tComment = useTranslations("commentList");
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

  const isUserComment = "author" in comment;
  const user = isUserComment
    ? (comment as UserCommentList[number]).author
    : (comment as CommentList[number]).author;
  const isLikedValue = "isLiked" in comment ? comment.isLiked : false;

  const [isLiked, setIsLiked] = useState(isLikedValue || false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);

  const contentHtml = prepareCommentHtmlForDisplay(String(comment.content || ""));
  const {
    displayHtml,
    isTranslated,
    isTranslating,
    renderKey,
    shouldAutoTranslate,
    toggleTranslate,
    contentMatchesLocale,
  } = useManualHtmlTranslate({
    html: contentHtml,
    resetKey: `account-comment-${comment.id}-${comment.content}`,
  });

  const safeParentContentHtml = sanitizeHtmlForRender(
    String(comment.parent?.content || ""),
  );

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
    onLike?.(comment?.id || 0);
  };

  const handleReply = () => {
    onReply?.(comment?.id || 0);
  };

  return (
    <div className={cn("border-b border-border pb-4", className)}>
      <div className="mt-4 px-4">
        <div className="flex items-center">
          <Avatar className="size-8" url={user?.avatar || ""} />
          <div className="ml-3 flex flex-1 flex-col self-stretch justify-start">
            <span className="leading-5 font-semibold hover:text-primary">
              {user?.nickname || user?.username || ""}
            </span>
            <span className="mt-1 text-xs leading-3.5 text-secondary">
              {formatRelativeTime(comment?.createdAt || "", t, locale)}
            </span>
          </div>
          {!contentMatchesLocale && (
            <button
              type="button"
              title={tComment("translate")}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-lg p-1 text-secondary transition hover:bg-muted hover:text-primary",
                isTranslated && "bg-muted text-primary",
                isTranslating && "pointer-events-none opacity-70",
              )}
              onClick={() => void toggleTranslate()}
            >
              {isTranslating ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Languages size={18} />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="ml-16 mt-2 cursor-pointer pr-4">
        <div
          key={renderKey}
          {...(shouldAutoTranslate
            ? { "data-auto-translate-comment": true }
            : {})}
          dangerouslySetInnerHTML={{ __html: displayHtml }}
        />
      </div>

      {comment.parent && (
        <div className="ml-16 mt-2 max-h-10 border-l-2 border-muted pl-1.5 pr-4">
          <p className="line-clamp-2 text-ellipsis text-sm text-secondary">
            @
            {comment?.parent?.author?.nickname ||
              comment?.parent?.author?.username ||
              ""}
            :
            <span
              dangerouslySetInnerHTML={{ __html: safeParentContentHtml }}
            />
          </p>
        </div>
      )}

      <div className="ml-16 mt-3 cursor-pointer pr-4">
        <Link
          href={`/article/${comment?.article?.id}`}
          className="flex h-12.5 items-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-600"
        >
          {(() => {
            const rawImages = (comment?.article?.images || []) as (string | ImageInfo)[];
            const cover = comment?.article?.cover;
            let imageUrl: string | undefined;

            if (cover) {
              imageUrl = typeof cover === "string" ? cover : getImageUrl(cover, "small");
            } else if (rawImages.length > 0) {
              const firstImg = rawImages[0];
              imageUrl = typeof firstImg === "string" ? firstImg : getImageUrl(firstImg, "small");
            }

            if (!imageUrl) return null;

            return (
              <div className="relative size-12.5 bg-gray-50">
                <Image
                  alt={comment?.article?.title || ""}
                  src={imageUrl}
                  fill
                  quality={95}
                  className="object-cover"
                />
              </div>
            );
          })()}
          <div className="ml-3">
            <span className="line-clamp-1 text-ellipsis text-secondary">
              {comment?.article?.title || ""}
            </span>
          </div>
        </Link>
      </div>

      <div className="ml-16 mt-4 pr-4">
        <div className="flex items-center text-secondary">
          <span className="flex-1 text-sm">
            {comment?.article?.category?.name}
          </span>
          <div className="flex items-center text-sm leading-5">
            <div className="flex items-center space-x-4">
              <div
                className="flex cursor-pointer items-center space-x-1 hover:text-primary"
                onClick={handleReply}
              >
                <MessageCircle size={18} />
                <span>{tComment("reply")}</span>
              </div>
              <div
                className={cn(
                  "flex cursor-pointer items-center space-x-1 hover:text-primary",
                  isLiked && "text-primary",
                )}
                onClick={handleLike}
              >
                <ThumbsUp size={18} />
                <span>
                  {formatCompactNumber(likeCount, {
                    locale,
                    labels: compactNumberLabels,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
