"use client";

import { ArticleList } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArticleCard } from "@/components/article";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

type ArticleListClientProps = {
    initArticles: ArticleList;
    initPage: number;
    initTotal: number;
    /**
     * 自定义获取文章的函数
     */
    fetchArticles: (params: any) => Promise<any>;
    /**
     * 传递给 fetchArticles 的额外参数（如 path: { id }）
     */
    fetchParams?: Record<string, any>;
    /**
     * 每页加载数量
     */
    pageSize?: number;

    /**
     * 是否显示关注按钮
     */
    showFollow?: boolean;
    
    /**
     * 缓存 key，用于区分不同列表
     */
    cacheKey?: string;
};

export const ArticleListClient = ({
    initArticles,
    initPage,
    initTotal,
    fetchArticles,
    fetchParams = {},
    pageSize = 10,
    showFollow = true,
    cacheKey
}: ArticleListClientProps) => {
    const t = useTranslations("articleList");
    const pathname = usePathname();
    
    // 生成唯一的缓存 key
    const storageKey = cacheKey || `article-list-${pathname}`;
    const scrollKey = `${storageKey}-scroll`;
    
    // 检测是否是刷新操作并清空缓存（在组件初始化时立即执行）
    const getInitialState = () => {
        if (typeof window === 'undefined') {
            return { articles: initArticles, page: initPage };
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
            return { articles: initArticles, page: initPage };
        }
        
        // 尝试从 sessionStorage 恢复状态
        try {
            const cached = sessionStorage.getItem(storageKey);
            if (cached) {
                const { articles, page, timestamp } = JSON.parse(cached);
                // 缓存 5 分钟内有效
                if (Date.now() - timestamp < 5 * 60 * 1000) {
                    return { articles, page };
                }
            }
        } catch (e) {
            console.error('Failed to restore cache:', e);
        }
        
        return { articles: initArticles, page: initPage };
    };
    
    const initialState = getInitialState();
    const isPageRefresh = useRef(
        typeof window !== 'undefined' && 
        (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'reload'
    );
    
    const [page, setPage] = useState(initialState.page);
    const [articles, setArticles] = useState<ArticleList>(initialState.articles);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialState.articles.length < initTotal);
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
                articles,
                page,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Failed to cache state:', e);
        }
    }, [articles, page, storageKey]);
    
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

    // Load more articles function
    const loadMoreArticles = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        setError(null);

        try {
            
            const response = await fetchArticles({
                query: {
                    page: page,
                    limit: pageSize,
                },
                ...fetchParams,
            });

            if (response.data?.data?.data) {
                const newArticles = response.data.data.data;

                if (newArticles.length === 0) {
                    setHasMore(false);
                } else {
                    setArticles((prev) => [...prev, ...newArticles]);
                    setPage(page+1);

                    // Check if we've loaded all articles based on total from response
                    const responseTotal = response.data.data.meta?.total || initTotal;
                    const totalLoaded = articles.length + newArticles.length;
                    if (totalLoaded >= responseTotal) {
                        setHasMore(false);
                    }
                }
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to load more articles:", err);
            setError(t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, articles.length, initTotal, fetchArticles, fetchParams, pageSize, t]);

    // Set up Intersection Observer
    useEffect(() => {
        if (!observerRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !loading) {
                    loadMoreArticles();
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
    }, [loadMoreArticles, hasMore, loading]);

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observerInstanceRef.current) {
                observerInstanceRef.current.disconnect();
            }
        };
    }, []);

    return (
        <div className="space-y-4">
            {/* Article list */}
            {articles.map((article) => (
                <ArticleCard article={article} key={article.id} showFollow={showFollow} />
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
                            onClick={loadMoreArticles}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            disabled={loading}
                        >
                            {t("retry")}
                        </button>
                    </div>
                </div>
            )}

            {/* End of list indicator */}
            {!hasMore && articles.length > 0 && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-secondary text-sm">{t("allLoaded")}</div>
                </div>
            )}

            {/* Empty state */}
            {!hasMore && articles.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center text-muted-foreground">
                        <p>{t("noArticles")}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
