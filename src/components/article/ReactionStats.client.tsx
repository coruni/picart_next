"use client";

import { articleControllerLike } from "@/api";
import { useState } from "react";
import { cn } from "@/lib";

interface ReactionStatsProps {
    articleId: string;
    initialStats: Record<string, number>;
    // 可选：初始用户反应状态
    initialUserReaction?: string;
}

export function ReactionStats({ articleId, initialStats, initialUserReaction }: ReactionStatsProps) {
    const [reactionStats, setReactionStats] = useState<Record<string, number>>(initialStats);
    const [loading, setLoading] = useState(false);
    // 用户只能有一个反应，所以使用 Set 但最多只包含一个元素
    const [userReactions, setUserReactions] = useState<Set<string>>(
        new Set(initialUserReaction ? [initialUserReaction] : [])
    );

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
    const handleReactionClick = async (emoji: string) => {
        if (loading) return;

        setLoading(true);
        const wasReacted = userReactions.has(emoji);
        const currentReaction = Array.from(userReactions)[0]; // 获取当前用户的反应

        try {
            const { data } = await articleControllerLike({
                path: { id: articleId },
                body: {
                    reactionType: emoji as "like" | "love" | "haha" | "wow" | "sad" | "angry" | "dislike"
                }
            });

            // 从API响应更新状态
            if (data?.code === 200) {
                console.log('API response:', data);
                
                // 本地更新逻辑：每个用户只能有一个反应
                setReactionStats(prev => {
                    const newStats = { ...prev };
                    
                    if (wasReacted) {
                        // 如果点击的是当前反应，则移除它
                        newStats[emoji] = Math.max(0, (newStats[emoji] || 0) - 1);
                    } else {
                        // 如果用户之前有其他反应，先减少那个反应的计数
                        if (currentReaction && currentReaction !== emoji) {
                            newStats[currentReaction] = Math.max(0, (newStats[currentReaction] || 0) - 1);
                        }
                        // 增加新反应的计数
                        newStats[emoji] = (newStats[emoji] || 0) + 1;
                    }
                    
                    return newStats;
                });

                // 更新用户反应状态：清除所有反应，然后设置新的（如果不是移除操作）
                setUserReactions(() => {
                    const newSet = new Set<string>();
                    if (!wasReacted) {
                        newSet.add(emoji);
                    }
                    // 如果 wasReacted 为 true，则 newSet 保持为空，表示移除反应
                    return newSet;
                });
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
        <div className="mt-5 flex items-center gap-1 text-xs text-secondary">
            {Object.entries(reactionStats).map(([emoji, count]) => {
                const isReacted = userReactions.has(emoji);
                return (
                    <button
                        key={emoji}
                        onClick={() => handleReactionClick(emoji)}
                        className={cn(
                            "flex items-center h-6 px-1.5 py-0.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50",
                            isReacted
                                ? "bg-primary/15 text-primary"
                                : "bg-[#F5F7FA] dark:bg-gray-700 hover:bg-[#E8ECEF] dark:hover:bg-gray-600"
                        )}
                    >
                        <span className="mr-1">{emoji}</span>
                        <span>{count}</span>
                    </button>
                );
            })}
        </div>
    );
}
