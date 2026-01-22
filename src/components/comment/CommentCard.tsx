"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, MessageCircle, MoreHorizontal, Reply, ThumbsUp } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AllComments, CommentList, UserCommentList } from "@/types";
import Image from "next/image";
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
  showReplies = true,
  isReply = false,
  className
}: CommentCardProps) {
  const t = useTranslations("time");
  const tComment = useTranslations("commentList");

  // Handle both CommentList and UserCommentList structures
  const isUserComment = 'author' in comment;
  const user = isUserComment ? (comment as UserCommentList[number]).author : (comment as CommentList[number]).author;
  const isLikedValue = 'isLiked' in comment ? comment.isLiked : false;

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

  return (
    <div className="border-b border-border pb-4">
      <div className="px-4 mt-4">
        <div className="flex items-center ">
          {/* 头像 */}
          <Avatar size="lg" url={comment.author.avatar}></Avatar>
          {/* 信息 */}
          <div className="ml-3 flex flex-col flex-1 self-stretch justify-start">
            <span className="leading-5 font-semibold hover:text-primary">{comment.author.nickname || comment.author.username}</span>
            <span className="mt-1 text-secondary text-sm leading-3.5">{formatRelativeTime(comment.createdAt, t)}</span>
          </div>
        </div>
      </div>
      {/* 内容 */}
      <div className="ml-16 pl-3 pr-4 mt-2 cursor-pointer">
        <div className="text-[#000000d9]" dangerouslySetInnerHTML={{ __html: String(comment.content || '') }}></div>
      </div>

      {/* 回复了谁 */}
      {comment.parent && (
        <div className="ml-19 mt-2 pl-1.5 border-l-2 pr-4 border-[#f1f4f9] max-h-10">
          <p className="text-secondary text-sm line-clamp-2 text-ellipsis">@{comment.parent.author.nickname || comment.parent.author.username}:{comment.parent.content}</p>
        </div>
      )}
      {/* 文章信息 */}
      <div className="ml-16 pl-3 pr-4 mt-3 cursor-pointer">
        <div className="flex items-center h-12.5 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-600">
          {(!!comment.article.cover || comment.article.images.length > 0) && (
            <div className="size-12.5 bg-gray-50 relative">
              <Image alt={comment.article.title} src={comment.article?.cover || comment.article.images?.[0] || ''} fill quality={95} className="object-cover"></Image>
            </div>
          )}
          <div className="ml-3">
            <span className="text-secondary line-clamp-1 text-ellipsis">{comment.article.title}</span>
          </div>
        </div>
      </div>
      {/* 底部信息 */}
      <div className="ml-19 pr-4 mt-4">
        <div className="flex items-center text-secondary ">
          <span className="text-sm flex-1">{comment?.article?.category?.name}</span>
          <div className="flex items-center text-sm leading-5">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 hover:text-primary cursor-pointer">
                <MessageCircle size={18} />
                <span>回复</span>
              </div>
              <div className="flex items-center space-x-1 hover:text-primary cursor-pointer">
                <ThumbsUp size={18} />
                <span>点赞</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}