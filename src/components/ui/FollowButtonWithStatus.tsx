"use client";

import { ArticleDetail, ArticleList, UserList } from "@/types";
import { Button } from "./Button";
import { useState } from "react";
import { userControllerFollow, userControllerUnfollow } from "@/api";
import { useUserStore } from "@/stores/useUserStore";
import { useTranslations } from "next-intl";
import { cn } from "@/lib";

type Author = ArticleList[number]['author'] | ArticleDetail['author'] | UserList[number];

type FollowButtonWithStatusProps = {
    author: Author;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children?: React.ReactNode;
    onFollowChange?: (isFollowed: boolean) => void;
};

export const FollowButtonWithStatus = ({
    author,
    size = "md",
    className,
    children,
    onFollowChange
}: FollowButtonWithStatusProps) => {
    const t = useTranslations('followButton');
    const user = useUserStore((state) => state.user);
    const [isFollowed, setIsFollowed] = useState(author?.isFollowed || false);
    const [isLoading, setIsLoading] = useState(false);

    // Don't show follow button for own profile
    if (!author || user?.id === author.id || isFollowed) {
        return null;
    }

    const handleFollowToggle = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            if (isFollowed) {
                // Unfollow
                await userControllerUnfollow({
                    path: { id: author.id!.toString() }
                });
                setIsFollowed(false);
                onFollowChange?.(false);

            } else {
                // Follow
                await userControllerFollow({
                    path: { id: author.id!.toString() }
                });
                setIsFollowed(true);
                onFollowChange?.(true);

            }
        } catch (error) {
            console.error('Follow/unfollow failed:', error);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            className={cn(`ml-2 rounded-full px-6`, className)}
            onClick={handleFollowToggle}
            disabled={isLoading}
            size={size}
        >
            {children ? children : (
                <span className="text-xs">
                    {isLoading
                        ? '...'
                        : isFollowed
                            ? t('following')
                            : t('follow')
                    }
                </span>
            )}

        </Button>
    );
};