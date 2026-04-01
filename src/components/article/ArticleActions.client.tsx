"use client";

import { formatCompactNumber } from "@/lib";
import { MessageCircleMore, Star, ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
    const locale = useLocale();
    const tAccountInfo = useTranslations("accountInfo");
    const compactNumberLabels = {
        thousand: tAccountInfo("numberUnits.thousand"),
        tenThousand: tAccountInfo("numberUnits.tenThousand"),
        hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
        million: tAccountInfo("numberUnits.million"),
        billion: tAccountInfo("numberUnits.billion"),
    };
    return (
        <div className="mt-4 py-6 flex items-center justify-evenly">
            {/* 评论 */}
            <div className="flex flex-col items-center justify-center group cursor-pointer">
                <div className="rounded-full group-hover:bg-primary/15 p-1">
                    <MessageCircleMore className="text-secondary" />
                </div>
                <span className="text-secondary text-sm">
                    {formatCompactNumber(commentCount, { locale, labels: compactNumberLabels })}
                </span>
            </div>

            {/* 收藏 */}
            <div className="flex flex-col items-center justify-center group cursor-pointer">
                <div className="rounded-full group-hover:bg-primary/15 p-1">
                    <Star className="text-secondary" />
                </div>
                <span className="text-secondary text-sm">
                    {formatCompactNumber(favoriteCount, { locale, labels: compactNumberLabels })}
                </span>
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
                <span className="text-secondary text-sm">
                    {formatCompactNumber(likes, { locale, labels: compactNumberLabels })}
                </span>
            </div>

            {/* 分享 */}
            <div className="flex flex-col items-center justify-center group cursor-pointer">
                <div className="rounded-full group-hover:bg-primary/15 p-1">
                    <ExternalLink className="text-secondary" />
                </div>
                <span className="text-secondary text-sm">
                    {formatCompactNumber(likes, { locale, labels: compactNumberLabels })}
                </span>
            </div>
        </div>
    );
}
