"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, MoreHorizontal, Reply } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { CommentList, UserCommentList } from "@/types";

interface CommentCardProps {
  comment: CommentList[number] | UserCommentList[number];
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
  showReplies = true,
  isReply = false,
  className
}: CommentCardProps) {
  const t = useTranslations("time");
  const tComment = useTranslations("commentList");
  
  // Handle both CommentList and UserCommentList structures
  const isUserComment = 'author' in comment;
  const user = isUserComment ? (comment as UserCommentList[number]).author : (comment as CommentList[number]).user;
  const hasReplies = 'replies' in comment && (comment as CommentList[number]).replies;
  const isLikedValue = 'isLiked' in comment ? (comment as CommentList[number]).isLiked : false;
  
  const [isLiked, setIsLiked] = useState(isLikedValue || false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    onLike?.(comment.id);
  };

  const handleReply = () => {
    onReply?.(comment.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t("justNow");
    if (diffInMinutes < 60) return t("minutesAgo", { count: diffInMinutes });
    if (diffInMinutes < 1440) return t("hoursAgo", { count: Math.floor(diffInMinutes / 60) });
    if (diffInMinutes < 43200) return t("daysAgo", { count: Math.floor(diffInMinutes / 1440) });

    return t("monthDay", {
      month: date.getMonth() + 1,
      day: date.getDate()
    });
  };

  const displayedReplies = showAllReplies
    ? hasReplies ? comment.replies : []
    : hasReplies ? comment.replies?.slice(0, 3) : [];

  return (
    <div className={cn(
      "space-y-3",
      isReply && "ml-12 border-l border-border pl-4",
      className
    )}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar
          url={user.avatar}
          size="sm"
        />

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* User info and time */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {user.nickname}
            </span>
            <span className="text-xs text-muted-foreground">
              @{user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(comment.createdAt)}
            </span>
          </div>

          {/* Comment content */}
          <div className="text-sm text-foreground leading-relaxed">
            {comment.content}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors hover:text-red-500",
                isLiked ? "text-red-500" : "text-muted-foreground"
              )}
            >
              <Heart
                size={14}
                className={cn(isLiked && "fill-current")}
              />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            <button
              onClick={handleReply}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <Reply size={14} />
              <span>{tComment("reply")}</span>
            </button>

            {comment.replyCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {comment.replyCount} {tComment("replies")}
              </span>
            )}

            <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && hasReplies && comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {displayedReplies?.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              showReplies={false}
              isReply={true}
            />
          ))}

          {/* Show more replies button */}
          {comment.replies.length > 3 && !showAllReplies && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="ml-12 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {tComment("viewMoreReplies", { count: comment.replies.length - 3 })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}