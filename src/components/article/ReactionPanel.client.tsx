"use client";

import { useState, useRef } from "react";
import {
  ThumbsUp,
  Heart,
  Laugh,
  Sparkles,
  Frown,
  Angry,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib";
import { useClickOutside } from "@/hooks";
import { articleControllerLike } from "@/api";
import { useTranslations } from "next-intl";

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
  onReactionChange?: (
    reactionType: ReactionType,
    newStats: ReactionStats,
  ) => void;
};

export const ReactionPanel = ({
  articleId,
  reactionStats,
  userReaction,
  showCount = true,
  onReactionChange,
}: ReactionPanelProps) => {
  const t = useTranslations("reactionPanel");
  const REACTIONS = [
    { type: "like" as ReactionType, icon: ThumbsUp, label: t("like"), color: "text-blue-500" },
    { type: "love" as ReactionType, icon: Heart, label: t("love"), color: "text-red-500" },
    { type: "haha" as ReactionType, icon: Laugh, label: t("haha"), color: "text-yellow-500" },
    { type: "wow" as ReactionType, icon: Sparkles, label: t("wow"), color: "text-purple-500" },
    { type: "sad" as ReactionType, icon: Frown, label: t("sad"), color: "text-gray-500" },
    { type: "angry" as ReactionType, icon: Angry, label: t("angry"), color: "text-orange-500" },
    { type: "dislike" as ReactionType, icon: ThumbsDown, label: t("dislike"), color: "text-gray-400" },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | undefined>(
    userReaction,
  );
  const [stats, setStats] = useState<ReactionStats>(reactionStats);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside(panelRef, () => setIsOpen(false));

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

  const totalReactions = Object.values(stats).reduce((sum, count) => sum + count, 0);

  const CurrentReactionIcon = currentReaction
    ? REACTIONS.find((r) => r.type === currentReaction)?.icon
    : ThumbsUp;

  const currentReactionColor = currentReaction
    ? REACTIONS.find((r) => r.type === currentReaction)?.color
    : undefined;

  return (
    <div className="relative" ref={panelRef}>
      <div
        className={cn(
          "flex items-center cursor-pointer hover:text-primary transition-colors",
          currentReaction && currentReactionColor,
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {CurrentReactionIcon && <CurrentReactionIcon size={20} className="text-secondary" />}
        {showCount && <span className="ml-2 text-xs">{totalReactions}</span>}
      </div>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-card rounded-xl shadow-lg py-2 px-3 z-10 min-w-92 max-w-100 w-full border border-border">
          <div className="grid grid-cols-5 gap-2">
            {REACTIONS.map((reaction) => {
              const Icon = reaction.icon;
              const count = stats[reaction.type];
              const isActive = currentReaction === reaction.type;

              return (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  disabled={isLoading}
                  className={cn(
                    "cursor-pointer flex flex-col items-center justify-center p-2 rounded-lg transition-all size-16",
                    "hover:bg-primary/10 hover:scale-110",
                    isActive && "bg-primary/15 ring-2 ring-primary/30",
                    isLoading && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <Icon
                    size={24}
                    className={cn(
                      "transition-colors",
                      isActive ? reaction.color : "text-secondary",
                    )}
                  />
                  <span className="text-xs mt-1 text-secondary">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

