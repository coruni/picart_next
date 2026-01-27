"use client";

import { useState, useRef } from "react";
import { ThumbsUp, Heart, Laugh, Sparkles, Frown, Angry, ThumbsDown } from "lucide-react";
import { cn } from "@/lib";
import { useClickOutside } from "@/hooks";
import { articleControllerLike } from "@/api";

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'dislike';

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
    onReactionChange?: (reactionType: ReactionType, newStats: ReactionStats) => void;
};

const REACTIONS = [
    { type: 'like' as ReactionType, icon: ThumbsUp, label: '赞', color: 'text-blue-500' },
    { type: 'love' as ReactionType, icon: Heart, label: '爱', color: 'text-red-500' },
    { type: 'haha' as ReactionType, icon: Laugh, label: '哈哈', color: 'text-yellow-500' },
    { type: 'wow' as ReactionType, icon: Sparkles, label: '哇', color: 'text-purple-500' },
    { type: 'sad' as ReactionType, icon: Frown, label: '难过', color: 'text-gray-500' },
    { type: 'angry' as ReactionType, icon: Angry, label: '生气', color: 'text-orange-500' },
    { type: 'dislike' as ReactionType, icon: ThumbsDown, label: '踩', color: 'text-gray-400' },
];

export const ReactionPanel = ({
    articleId,
    reactionStats,
    userReaction,
    showCount = true,
    onReactionChange
}: ReactionPanelProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentReaction, setCurrentReaction] = useState<string | undefined>(userReaction);
    const [stats, setStats] = useState<ReactionStats>(reactionStats);
    const [isLoading, setIsLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useClickOutside(panelRef as any, () => setIsOpen(false));

    const handleReaction = async (reactionType: ReactionType) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            await articleControllerLike({
                path: { id: articleId.toString() },
                body: { reactionType }
            });

            // Update local state
            const newStats = { ...stats };

            // Remove previous reaction count
            if (currentReaction && currentReaction in newStats) {
                newStats[currentReaction as ReactionType] = Math.max(0, newStats[currentReaction as ReactionType] - 1);
            }

            // Add new reaction count
            newStats[reactionType] = newStats[reactionType] + 1;

            setStats(newStats);
            setCurrentReaction(reactionType);
            setIsOpen(false);

            onReactionChange?.(reactionType, newStats);
        } catch (error) {
            console.error('Reaction failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get total reactions
    const totalReactions = Object.values(stats).reduce((sum, count) => sum + count, 0);

    // Get current reaction icon
    const CurrentReactionIcon = currentReaction 
        ? REACTIONS.find(r => r.type === currentReaction)?.icon 
        : ThumbsUp;
    
    const currentReactionColor = currentReaction
        ? REACTIONS.find(r => r.type === currentReaction)?.color
        : undefined;

    return (
        <div className="relative" ref={panelRef}>
            {/* Trigger Button */}
            <div
                className={cn(
                    "flex items-center cursor-pointer hover:text-primary transition-colors",
                    currentReaction && currentReactionColor
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {CurrentReactionIcon && <CurrentReactionIcon size={20} />}
                {showCount && (
                    <span className="ml-2 text-xs">{totalReactions}</span>
                )}
            </div>

            {/* Reaction Panel */}
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
                                        isLoading && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <Icon
                                        size={24}
                                        className={cn(
                                            "transition-colors",
                                            isActive ? reaction.color : "text-secondary"
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
