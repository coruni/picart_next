"use client";

import { articleControllerLike } from "@/api";
import angry from "@/assets/images/reaction/angry.png";
import dislike from "@/assets/images/reaction/dislike.png";
import haha from "@/assets/images/reaction/haha.png";
import like from "@/assets/images/reaction/like.png";
import love from "@/assets/images/reaction/love.png";
import sad from "@/assets/images/reaction/sad.png";
import wow from "@/assets/images/reaction/wow.png";
import { useClickOutside } from "@/hooks";
import { cn } from "@/lib";
import {
  Angry,
  Frown,
  Heart,
  Laugh,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image, { StaticImageData } from "next/image";
import { useMemo, useRef, useState } from "react";

type ReactionType =
  | "like"
  | "love"
  | "haha"
  | "wow"
  | "sad"
  | "angry"
  | "dislike";

type ReactionStats = {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
  dislike: number;
};

type ReactionPanelProps = {
  articleId: number;
  reactionStats: ReactionStats;
  userReaction?: string;
  showCount?: boolean;
  showReaction?: boolean;
  placement?: "top" | "bottom";
  onReactionChange?: (
    reactionType: ReactionType,
    newStats: ReactionStats,
  ) => void;
};

// Reaction image mapping (from ReactionStats.client)
const reactionImageMap: Record<string, StaticImageData> = {
  haha: haha,
  wow: wow,
  dislike: dislike,
  like: like,
  angry: angry,
  sad: sad,
  love: love,
};

export const ReactionPanel = ({
  articleId,
  reactionStats,
  userReaction,
  showCount = true,
  showReaction = false,
  placement = "top",
  onReactionChange,
}: ReactionPanelProps) => {
  const t = useTranslations("reactionPanel");

  const [isOpen, setIsOpen] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | undefined>(
    userReaction,
  );
  const [stats, setStats] = useState<ReactionStats>(reactionStats);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside(panelRef, () => setIsOpen(false));

  // Get top 2 reactions with highest counts
  const topReactions = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);
  }, [stats]);

  const REACTIONS = [
    {
      type: "like" as ReactionType,
      icon: ThumbsUp,
      label: t("like"),
      color: "text-primary",
    },
    {
      type: "love" as ReactionType,
      icon: Heart,
      label: t("love"),
      color: "text-red-500",
    },
    {
      type: "haha" as ReactionType,
      icon: Laugh,
      label: t("haha"),
      color: "text-yellow-500",
    },
    {
      type: "wow" as ReactionType,
      icon: Sparkles,
      label: t("wow"),
      color: "text-purple-500",
    },
    {
      type: "sad" as ReactionType,
      icon: Frown,
      label: t("sad"),
      color: "text-gray-500",
    },
    {
      type: "angry" as ReactionType,
      icon: Angry,
      label: t("angry"),
      color: "text-orange-500",
    },
    {
      type: "dislike" as ReactionType,
      icon: ThumbsDown,
      label: t("dislike"),
      color: "text-gray-400",
    },
  ];

  const handleReaction = async (reactionType: ReactionType) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await articleControllerLike({
        path: { id: articleId.toString() },
        body: { reactionType },
      });

      const newStats = { ...stats };

      if (currentReaction && currentReaction in newStats) {
        newStats[currentReaction as ReactionType] = Math.max(
          0,
          newStats[currentReaction as ReactionType] - 1,
        );
      }

      newStats[reactionType] = newStats[reactionType] + 1;

      setStats(newStats);
      setCurrentReaction(reactionType);
      setIsOpen(false);

      onReactionChange?.(reactionType, newStats);
    } catch (error) {
      console.error("Reaction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalReactions = Object.values(stats).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="relative" ref={panelRef}>
      <div
        className={cn(
          "flex items-center cursor-pointer transition-colors",
          currentReaction
            ? "text-primary"
            : "text-secondary hover:text-primary",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Main reaction icon with stacked top reactions on the right */}
        <div className="relative flex items-center">
          <ThumbsUp size={20} />
        </div>
        {showCount && (
          <span className="ml-2 text-xs mr-2">{totalReactions}</span>
        )}

        {/* Stacked top 2 reactions - positioned to the right with overlap */}
        {showReaction && topReactions.length > 0 && (
          <div className="relative flex items-center ">
            {topReactions.map(([type], index) => {
              const imgSrc = reactionImageMap[type];
              if (!imgSrc) return null;
              // Reverse order so first (highest count) is at the bottom
              const reverseIndex = topReactions.length - 1 - index;
              return (
                <div
                  key={type}
                  className="relative in-last:-ml-2"
                  style={{
                    zIndex: index + 1,
                  }}
                >
                  <Image
                    src={imgSrc}
                    alt={type}
                    width={0}
                    height={0}
                    className="size-6 rounded-full border border-background bg-card object-cover"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className={cn(
          "absolute mb-2 bg-card rounded-xl shadow-lg py-2 px-3 z-10 border border-border",
          "w-max ",
          // 根据 placement 决定位置
          placement === "top"
            ? "bottom-full -right-3"
            : "top-full right-0 mt-2 sm:-translate-x-1/2",
          isOpen ? "block" : "hidden",
        )}
      >
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
          {REACTIONS.map((reaction) => {
            const imgSrc = reactionImageMap[reaction.type];
            const isActive = currentReaction === reaction.type;

            return (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                disabled={isLoading}
                title={reaction.type}
                className={cn(
                  "cursor-pointer flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg transition-all size-12 sm:size-16",
                  "hover:bg-primary/10 hover:scale-110",
                  isActive && "bg-primary/15 ring-2 ring-primary/30",
                  isLoading && "opacity-50 cursor-not-allowed",
                )}
              >
                {imgSrc && (
                  <Image
                    src={imgSrc}
                    alt={reaction.type}
                    width={24}
                    height={24}
                    className={cn(
                      "size-8 sm:size-12 object-cover",
                      isActive ? "opacity-100" : "opacity-70",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
