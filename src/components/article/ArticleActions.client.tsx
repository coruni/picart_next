"use client";

import { MessageCircleMore, Star, ExternalLink } from "lucide-react";
import { ReactionPanel } from "./ReactionPanel.client";

type ReactionStats = {
    like: number;
    love: number;
    haha: number;
    wow: number;
    sad: number;
    angry: number;
    dislike: number;
};

type ArticleActionsProps = {
    articleId: number;
    commentCount: number;
    favoriteCount: number;
    reactionStats: ReactionStats;
    userReaction?: string;
    likes: number;
};

export function ArticleActions({
    articleId,
    commentCount,
    favoriteCount,
    reactionStats,
    userReaction,
    likes
}: ArticleActionsProps) {
    return (
        <div className="mt-4 py-6 flex items-center justify-evenly">
            {/* 评论 */}
            <div className="flex flex-col items-center justify-center group cursor-pointer">
                <div className="rounded-full group-hover:bg-primary/15 p-1">
                    <MessageCircleMore />
                </div>
                <span className="text-secondary text-sm">{commentCount}</span>
            </div>

            {/* 收藏 */}
            <div className="flex flex-col items-center justify-center group cursor-pointer">
                <div className="rounded-full group-hover:bg-primary/15 p-1">
                    <Star />
                </div>
                <span className="text-secondary text-sm">{favoriteCount}</span>
            </div>

            {/* 反应 */}
            <div className="flex flex-col items-center justify-center group cursor-pointer">
                <div className="rounded-full group-hover:bg-primary/15 p-1">
                    <ReactionPanel
                        showCount={false}
                        articleId={articleId}
                        reactionStats={reactionStats}
                        userReaction={userReaction}
                    />
                </div>
                <span className="text-secondary text-sm">{likes}</span>
            </div>

            {/* 分享 */}
            <div className="flex flex-col items-center justify-center group cursor-pointer">
                <div className="rounded-full group-hover:bg-primary/15 p-1">
                    <ExternalLink />
                </div>
                <span className="text-secondary text-sm">{likes}</span>
            </div>
        </div>
    );
}
