"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { FeedActions } from "./FeedActions";

interface FeedCardProps {
  article: {
    id?: number;
    title?: string;
    content?: string;
    coverImage?: string;
    author?: {
      id?: number;
      username?: string;
      avatar?: string;
    };
    createdAt?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
}

export function FeedCard({ article }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* 作者信息 */}
      <div className="flex items-center justify-between p-5 pb-3">
        <Link
          href={`/user/${article.author?.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 ring-2 ring-white shadow-md">
            {article.author?.avatar ? (
              <Image
                src={article.author.avatar}
                alt={article.author.username || "用户"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                {article.author?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {article.author?.username || "匿名用户"}
            </div>
            <div className="text-sm text-gray-500">
              {article.createdAt && formatRelativeTime(article.createdAt)}
            </div>
          </div>
        </Link>

        <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      {/* 内容 */}
      <Link href={`/article/${article.id}`} className="block px-5">
        {article.title && (
          <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors line-clamp-2">
            {article.title}
          </h2>
        )}
        {article.content && (
          <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
            {article.content}
          </p>
        )}
      </Link>

      {/* 封面图 */}
      {article.coverImage && (
        <Link href={`/article/${article.id}`} className="block px-5 mb-4">
          <div className="relative w-full h-80 rounded-xl overflow-hidden group">
            <Image
              src={article.coverImage}
              alt={article.title || "文章封面"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      )}

      {/* 操作栏 */}
      <div className="px-5 pb-5 pt-2 border-t border-gray-100">
        <FeedActions
          viewCount={article.viewCount || 0}
          likeCount={likeCount}
          commentCount={article.commentCount || 0}
          isLiked={isLiked}
          onLike={handleLike}
        />
      </div>
    </article>
  );
}
