"use client";

import {
    articleControllerFavoriteArticle,
    articleControllerUnfavoriteArticle,
} from "@/api";
import { formatCompactNumber } from "@/lib";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import { ExternalLink, MessageCircleMore, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
    initialIsFavorited?: boolean;
    reactionStats: ReactionStats;
    userReaction?: string;
    likes: number;
};

export function ArticleActions({
    articleId,
    commentCount,
    favoriteCount,
    initialIsFavorited = false,
    reactionStats,
    userReaction,
    likes,
}: ArticleActionsProps) {
    const locale = useLocale();
    const tAccountInfo = useTranslations("accountInfo");
    const isAuthenticated = useUserStore((state) => state.isAuthenticated);
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [currentFavoriteCount, setCurrentFavoriteCount] =
        useState(favoriteCount);
    const [favoriteSubmitting, setFavoriteSubmitting] = useState(false);

    useEffect(() => {
        setIsFavorited(initialIsFavorited);
    }, [initialIsFavorited]);

    useEffect(() => {
        setCurrentFavoriteCount(favoriteCount);
    }, [favoriteCount]);

    const compactNumberLabels = {
        thousand: tAccountInfo("numberUnits.thousand"),
        tenThousand: tAccountInfo("numberUnits.tenThousand"),
        hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
        million: tAccountInfo("numberUnits.million"),
        billion: tAccountInfo("numberUnits.billion"),
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            openLoginDialog();
            return;
        }

        if (favoriteSubmitting) {
            return;
        }

        const previousIsFavorited = isFavorited;
        const nextIsFavorited = !previousIsFavorited;

        setFavoriteSubmitting(true);
        setIsFavorited(nextIsFavorited);
        setCurrentFavoriteCount((prev) =>
            Math.max(prev + (nextIsFavorited ? 1 : -1), 0),
        );

        try {
            if (nextIsFavorited) {
                await articleControllerFavoriteArticle({
                    path: { id: String(articleId) },
                });
            } else {
                await articleControllerUnfavoriteArticle({
                    path: { id: String(articleId) },
                });
            }
        } catch (error) {
            console.error("Failed to toggle article favorite:", error);
            setIsFavorited(previousIsFavorited);
            setCurrentFavoriteCount((prev) =>
                Math.max(prev + (previousIsFavorited ? 1 : -1), 0),
            );
        } finally {
            setFavoriteSubmitting(false);
        }
    };

    return (
        <div className="mt-4 flex items-center justify-evenly py-6">
            <div className="group flex cursor-pointer flex-col items-center justify-center">
                <div className="rounded-full p-1 group-hover:bg-primary/15">
                    <MessageCircleMore className="text-secondary" />
                </div>
                <span className="text-sm text-secondary">
                    {formatCompactNumber(commentCount, {
                        locale,
                        labels: compactNumberLabels,
                    })}
                </span>
            </div>

            <button
                type="button"
                onClick={() => void handleToggleFavorite()}
                disabled={favoriteSubmitting}
                className="group flex cursor-pointer flex-col items-center justify-center disabled:opacity-60"
            >
                <div className="rounded-full p-1 group-hover:bg-primary/15">
                    <Star
                        className={
                            isFavorited
                                ? "fill-current text-primary"
                                : "text-secondary"
                        }
                    />
                </div>
                <span
                    className={
                        isFavorited ? "text-sm text-primary" : "text-sm text-secondary"
                    }
                >
                    {formatCompactNumber(currentFavoriteCount, {
                        locale,
                        labels: compactNumberLabels,
                    })}
                </span>
            </button>

            <div className="group flex cursor-pointer flex-col items-center justify-center">
                <div className="rounded-full p-1 group-hover:bg-primary/15">
                    <ReactionPanel
                        showCount={false}
                        articleId={articleId}
                        reactionStats={reactionStats}
                        userReaction={userReaction}
                    />
                </div>
                <span className="text-sm text-secondary">
                    {formatCompactNumber(likes, {
                        locale,
                        labels: compactNumberLabels,
                    })}
                </span>
            </div>

            <div className="group flex cursor-pointer flex-col items-center justify-center">
                <div className="rounded-full p-1 group-hover:bg-primary/15">
                    <ExternalLink className="text-secondary" />
                </div>
                <span className="text-sm text-secondary">
                    {formatCompactNumber(likes, {
                        locale,
                        labels: compactNumberLabels,
                    })}
                </span>
            </div>
        </div>
    );
}
