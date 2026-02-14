"use client";

import { ArticleDetail, ArticleList, UserList } from "@/types";
import { Button } from "./Button";
import { useState } from "react";
import { userControllerFollow, userControllerUnfollow } from "@/api";
import { useUserStore } from "@/stores/useUserStore";
import { useTranslations } from "next-intl";
import { cn } from "@/lib";
import { Check } from "lucide-react";

/**
 * 作者类型定义
 */
type Author = ArticleList[number]['author'] | ArticleDetail['author'] | UserList[number];

/**
 * 关注按钮组件属性接口
 * @interface FollowButtonWithStatusProps
 * 
 * @property {Author} author - 作者信息
 * @property {('sm' | 'md' | 'lg')} [size] - 按钮尺寸
 * @property {string} [className] - 自定义样式类名
 * @property {React.ReactNode} [children] - 自定义按钮内容
 * @property {(isFollowed: boolean) => void} [onFollowChange] - 关注状态变化回调
 */
type FollowButtonWithStatusProps = {
    author: Author;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children?: React.ReactNode;
    onFollowChange?: (isFollowed: boolean) => void;
};

/**
 * 带状态的关注按钮组件
 * @component
 * 
 * 关注/取消关注按钮，点击关注后会显示对勾动画并自动隐藏
 * 已关注的用户不显示按钮，自己的个人资料页也不显示
 * 
 * @example
 * ```tsx
 * <FollowButtonWithStatus 
 *   author={user}
 *   onFollowChange={(isFollowed) => console.log(isFollowed)}
 * />
 * ```
 */
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
    const [isAnimating, setIsAnimating] = useState(false);
    const [isHiding, setIsHiding] = useState(false);

    // Don't show follow button for own profile or if already followed
    if (!author || user?.id === author.id) {
        return null;
    }

    // 如果已关注且不在动画中，不显示按钮
    if (isFollowed && !isAnimating && !isHiding) {
        return null;
    }

    const handleFollowToggle = async () => {
        if (isLoading || isAnimating) return;
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
                // Follow - 开始动画
                await userControllerFollow({
                    path: { id: author.id!.toString() }
                });
                setIsFollowed(true);
                setIsAnimating(true);
                onFollowChange?.(true);

                // 动画序列: 收缩 -> 显示对勾 -> 隐藏
                setTimeout(() => {
                    setIsHiding(true);
                }, 600); // 收缩并显示对勾的时间

                setTimeout(() => {
                    setIsAnimating(false);
                    setIsHiding(false);
                }, 1000); // 完全隐藏的时间
            }
        } catch (error) {
            console.error('Follow/unfollow failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            className={cn(
                "ml-2 rounded-full transition-all duration-500 ease-in-out overflow-hidden",
                isAnimating && !isHiding && "px-3! w-10! h-10!",
                isHiding && "opacity-0 scale-0 translate-x-8",
                !isAnimating && !isHiding && "px-6",
                className
            )}
            onClick={handleFollowToggle}
            disabled={isLoading || isAnimating}
            size={size}
        >
            {children ? children : (
                <div className="relative flex items-center justify-center w-full h-full">
                    <span 
                        className={cn(
                            "text-xs transition-all duration-300 whitespace-nowrap",
                            isAnimating && "opacity-0 scale-0"
                        )}
                    >
                        {isLoading && !isAnimating
                            ? '...'
                            : isFollowed
                                ? t('following')
                                : t('follow')
                        }
                    </span>
                    {isAnimating && (
                        <Check 
                            className={cn(
                                "absolute size-4 transition-all duration-300",
                                "animate-in fade-in-50 zoom-in-50"
                            )} 
                        />
                    )}
                </div>
            )}
        </Button>
    );
};