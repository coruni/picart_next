"use client";

import { TagList } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { tagControllerFindAll } from "@/api";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { TagCard } from "./TopicCard";
import { usePathname } from "next/navigation";

type TagListClientProps = {
    initTags: TagList;
    initPage: number;
    initTotal: number;
    pageSize?: number;
    cacheKey?: string;
};

export const TagListClient = ({
    initTags,
    initPage,
    initTotal,
    pageSize = 10,
    cacheKey
}: TagListClientProps) => {
    const t = useTranslations("tagList");
    const pathname = usePathname();
    
    // 生成唯一的缓存 key
    const storageKey = cacheKey || `tag-list-${pathname}`;
    const scrollKey = `${storageKey}-scroll`;
    
    // 检测是否是刷新操作并清空缓存（在组件初始化时立即执行）
    const getInitialState = () => {
        if (typeof window === 'undefined') {
            return { tags: initTags, page: initPage };
        }
        
        // 检测页面加载类型
        const navigationType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type;
        
        if (navigationType === 'reload') {
            // 页面刷新，清空缓存
            try {
                sessionStorage.removeItem(storageKey);
                sessionStorage.removeItem(scrollKey);
            } catch (e) {
                console.error('Failed to clear cache on refresh:', e);
            }
            return { tags: initTags, page: initPage };
        }
        
        // 尝试从 sessionStorage 恢复状态
        try {
            const cached = sessionStorage.getItem(storageKey);
            if (cached) {
                const { tags, page, timestamp } = JSON.parse(cached);
                // 缓存 5 分钟内有效
                if (Date.now() - timestamp < 5 * 60 * 1000) {
                    return { tags, page };
                }
            }
        } catch (e) {
            console.error('Failed to restore cache:', e);
        }
        
        return { tags: initTags, page: initPage };
    };
    
    const initialState = getInitialState();
    const isPageRefresh = useRef(
        typeof window !== 'undefined' && 
        (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'reload'
    );
    
    const [page, setPage] = useState(initialState.page);
    const [tags, setTags] = useState<TagList>(initialState.tags);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialState.tags.length < initTotal);
    const [error, setError] = useState<string | null>(null);
    const [scrollRestored, setScrollRestored] = useState(false);

    // Intersection Observer ref
    const observerRef = useRef<HTMLDivElement>(null);
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);
    
    // 保存状态到 sessionStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        try {
            sessionStorage.setItem(storageKey, JSON.stringify({
                tags,
                page,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Failed to cache state:', e);
        }
    }, [tags, page, storageKey]);
    
    // 保存滚动位置
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleScroll = () => {
            try {
                sessionStorage.setItem(scrollKey, window.scrollY.toString());
            } catch (e) {
                console.error('Failed to save scroll position:', e);
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrollKey]);
    
    // 恢复滚动位置
    useEffect(() => {
        if (typeof window === 'undefined' || scrollRestored || isPageRefresh.current) return;
        
        try {
            const savedScroll = sessionStorage.getItem(scrollKey);
            if (savedScroll) {
                // 使用 requestAnimationFrame 确保 DOM 已渲染
                requestAnimationFrame(() => {
                    window.scrollTo(0, parseInt(savedScroll, 10));
                    setScrollRestored(true);
                });
            } else {
                setScrollRestored(true);
            }
        } catch (e) {
            console.error('Failed to restore scroll position:', e);
            setScrollRestored(true);
        }
    }, [scrollKey, scrollRestored]);

    // Load more tags function
    const loadMoreTags = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        setError(null);

        try {
            const response = await tagControllerFindAll({
                query: {
                    page: page,
                    limit: pageSize,
                },
            });

            if (response.data?.data?.data) {
                const newTags = response.data.data.data;

                if (newTags.length === 0) {
                    setHasMore(false);
                } else {
                    setTags((prev) => [...prev, ...newTags]);
                    setPage(page + 1);

                    // Check if we've loaded all tags based on total from response
                    const responseTotal = response.data.data.meta?.total || initTotal;
                    const totalLoaded = tags.length + newTags.length;
                    if (totalLoaded >= responseTotal) {
                        setHasMore(false);
                    }
                }
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to load more tags:", err);
            setError(t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, tags.length, initTotal, pageSize, t]);

    // Set up Intersection Observer
    useEffect(() => {
        if (!observerRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !loading) {
                    loadMoreTags();
                }
            },
            {
                root: null,
                rootMargin: "100px", // Trigger 100px before the element comes into view
                threshold: 0.1,
            }
        );

        observerInstanceRef.current = observer;
        observer.observe(observerRef.current);

        return () => {
            if (observerInstanceRef.current) {
                observerInstanceRef.current.disconnect();
            }
        };
    }, [loadMoreTags, hasMore, loading]);

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observerInstanceRef.current) {
                observerInstanceRef.current.disconnect();
            }
        };
    }, []);

    return (
        <div className="space-y-4 p-2 pt-0">
            {/* Tag list */}
            {tags.map((tag) => (
                <TagCard key={tag.id} tag={tag} />
            ))}

            {/* Loading indicator and observer target */}
            {hasMore && (
                <div ref={observerRef} className="flex items-center justify-center py-8">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-secondary text-sm">{t("loading")}</span>
                        </div>
                    ) : (
                        <div className="text-secondary text-sm">{t("loadMore")}</div>
                    )}
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="flex items-center justify-center py-4">
                    <div className="text-center">
                        <p className="text-red-500 mb-2">{error}</p>
                        <button
                            onClick={loadMoreTags}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            disabled={loading}
                        >
                            {t("retry")}
                        </button>
                    </div>
                </div>
            )}

            {/* End of list indicator */}
            {!hasMore && tags.length > 0 && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground text-sm">{t("allLoaded")}</div>
                </div>
            )}

            {/* Empty state */}
            {!hasMore && tags.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center text-muted-foreground">
                        <p>{t("noTags")}</p>
                    </div>
                </div>
            )}
        </div>
    );
};