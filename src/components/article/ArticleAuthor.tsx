"use client";

import { useEffect, useRef, useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import type { ArticleDetail } from "@/types";
import { Link } from "@/i18n/routing";

type ArticleAuthorProps = {
    author: ArticleDetail['author']
    createdAt: string;
    onFollow?: () => void;
};

export function ArticleAuthor({ author, createdAt, onFollow }: ArticleAuthorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [originalTop, setOriginalTop] = useState(0);
    const [isSticky, setIsSticky] = useState(false);
    const t = useTranslations();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let scrollHandler: (() => void) | null = null;
        let resizeHandler: (() => void) | null = null;

        // 获取元素初始位置（相对于文档顶部的绝对位置）
        const updateOriginalPosition = () => {
            const rect = container.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            // 元素距离文档顶部的绝对距离 = 当前滚动距离 + 元素距离视口顶部的距离
            const absoluteTop = scrollTop + rect.top;
            setOriginalTop(absoluteTop);
        };

        // 监听滚动
        scrollHandler = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const stickyTop = 118; // 标题栏高度

            // 当滚动距离超过元素原始位置减去吸顶位置时，变为sticky
            if (scrollTop >= originalTop - stickyTop) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        resizeHandler = updateOriginalPosition;

        // 延迟获取位置，确保页面完全渲染
        const timer = setTimeout(() => {
            updateOriginalPosition();
            // 只有在获取到正确位置后才添加事件监听器
            if (scrollHandler) {
                window.addEventListener('scroll', scrollHandler, { passive: true });
            }
            if (resizeHandler) {
                window.addEventListener('resize', resizeHandler);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scrollHandler) {
                window.removeEventListener('scroll', scrollHandler);
            }
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
        };
    }, [originalTop]); // 保持 originalTop 作为依赖

    return (
        <div
            ref={containerRef}
            className={`h-12 px-6 flex items-center transition-all duration-200 sticky top-full z-10`}
        >
            <div className="flex items-center flex-1 cursor-pointer mx-auto w-full">
                {/* 头像 */}
                <Link href={`/account/${author.id}`} className="shrink-0">
                    <Avatar
                        size={isSticky ? 'sm' : 'lg'}
                        url={author?.avatar}
                        avatarFrame={author?.equippedDecorations?.AVATAR_FRAME?.imageUrl || ''}
                    />
                </Link>
                {/* 用户名 */}
                <div className="ml-3 flex flex-col flex-1">
                    <Link href={`/account/${author.id}`} className="flex items-center leading-5">
                        <span className="font-bold hover:text-primary">
                            {(author?.nickname || author?.username) as string}
                        </span>
                    </Link>
                    {!isSticky && (
                        <div className="mt-1 leading-4">
                            <span className="text-xs text-secondary">
                                {formatRelativeTime(createdAt, t)}
                            </span>
                        </div>
                    )}

                </div>

                {/* 关注 */}
                {!author?.isFollowed && (
                    <div className="ml-3 flex items-center w-auto">
                        <Button
                            className="ml-2 rounded-full px-6 min-w-22"
                            onClick={onFollow}
                        >
                            <span className="text-xs">关注</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}