"use client";

import { articleControllerLike } from "@/api";
import angry from "@/assets/images/reaction/angry.png";
import dislike from "@/assets/images/reaction/dislike.png";
import haha from "@/assets/images/reaction/haha.png";
import like from "@/assets/images/reaction/like.png";
import love from "@/assets/images/reaction/love.png";
import sad from "@/assets/images/reaction/sad.png";
import wow from "@/assets/images/reaction/wow.png";
import { cn } from "@/lib";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";

interface ReactionStatsProps {
  articleId: string;
  initialStats: Record<string, number>;
  // 可选：初始用户反应状态
  initialUserReaction?: string;
  // 外部控制的 stats，用于联动
  stats?: Record<string, number>;
  // 外部控制的 userReaction，用于联动
  userReaction?: string;
  // 反应变化回调
  onReactionChange?: (
    stats: Record<string, number>,
    userReaction: string | null,
  ) => void;
}

export function ReactionStats({
  articleId,
  initialStats,
  initialUserReaction,
  stats: externalStats,
  userReaction: externalUserReaction,
  onReactionChange,
}: ReactionStatsProps) {
  const isControlled = externalStats !== undefined;
  const [internalReactionStats, setInternalReactionStats] =
    useState<Record<string, number>>(initialStats);
  const [loading, setLoading] = useState(false);
  // 用户只能有一个反应，所以使用 Set 但最多只包含一个元素
  const [internalUserReactions, setInternalUserReactions] = useState<
    Set<string>
  >(new Set(initialUserReaction ? [initialUserReaction] : []));

  // 使用外部或内部的 stats
  const reactionStats = isControlled ? externalStats : internalReactionStats;
  // 使用外部或内部的 userReaction
  const userReactions =
    externalUserReaction !== undefined
      ? new Set(externalUserReaction ? [externalUserReaction] : [])
      : internalUserReactions;

  // 获取最新的反应统计
  // const fetchReactionStats = useCallback(async () => {
  //     try {
  //         // TODO: 调用 API 获取最新的反应统计和用户反应状态
  //         const response = await articleControllerGetReactionStats({
  //           path: { id: articleId }
  //         });
  //         setReactionStats(response.data?.stats || {});
  //         // 注意：用户只能有一个反应，所以 userReactions 应该是单个值或空
  //         const userReaction = response.data?.userReaction;
  //         setUserReactions(new Set(userReaction ? [userReaction] : []));
  //     } catch (error) {
  //         console.error("Failed to fetch reaction stats:", error);
  //     }
  // }, [articleId]);

  // 处理表情反应点击 - 每个用户只能有一个反应

  const emojiImageMap: Record<string, StaticImageData> = {
    haha: haha,
    wow: wow,
    dislike: dislike,
    like: like,
    angry: angry,
    sad: sad,
    love: love,
  };
  const handleReactionClick = async (emoji: string) => {
    if (loading) return;

    setLoading(true);
    const wasReacted = userReactions.has(emoji);
    const currentReaction = Array.from(userReactions)[0]; // 获取当前用户的反应

    try {
      const { data } = await articleControllerLike({
        path: { id: articleId },
        body: {
          reactionType: emoji as
            | "like"
            | "love"
            | "haha"
            | "wow"
            | "sad"
            | "angry"
            | "dislike",
        },
      });

      // 从API响应更新状态
      if (data?.code === 200) {
        // 本地更新逻辑：每个用户只能有一个反应
        const newStats = { ...reactionStats };

        if (wasReacted) {
          // 如果点击的是当前反应，则移除它
          newStats[emoji] = Math.max(0, (newStats[emoji] || 0) - 1);
        } else {
          // 如果用户之前有其他反应，先减少那个反应的计数
          if (currentReaction && currentReaction !== emoji) {
            newStats[currentReaction] = Math.max(
              0,
              (newStats[currentReaction] || 0) - 1,
            );
          }
          // 增加新反应的计数
          newStats[emoji] = (newStats[emoji] || 0) + 1;
        }

        // 更新用户反应状态：清除所有反应，然后设置新的（如果不是移除操作）
        const newUserReaction = wasReacted ? null : emoji;

        // 如果不是受控组件，更新内部状态
        if (!isControlled) {
          setInternalReactionStats(newStats);
          setInternalUserReactions(
            new Set(newUserReaction ? [newUserReaction] : []),
          );
        }

        // 调用回调通知父组件
        onReactionChange?.(newStats, newUserReaction);
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取最新数据

  if (Object.keys(reactionStats).length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex items-center gap-1 text-xs text-secondary flex-wrap">
      {Object.entries(reactionStats).map(([emoji, count]) => {
        const isReacted = userReactions.has(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            title={emoji}
            className={cn(
              "flex items-center h-6 px-1.5 py-0.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50 gap-1",
              isReacted
                ? "bg-primary text-white"
                : "bg-[#F5F7FA] dark:bg-gray-700 hover:bg-[#E8ECEF] dark:hover:bg-gray-600",
            )}
          >
            <Image
              src={emojiImageMap[emoji]}
              alt={emoji}
              className="size-6"
            ></Image>
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
