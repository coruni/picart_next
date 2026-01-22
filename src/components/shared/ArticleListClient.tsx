"use client";

import { ArticleList } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArticleCard } from "@/components/article";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
};

export const ArticleListClient = ({
    initArticles,
    initPage,
    initTotal,
    fetchArticles,
    fetchParams = {},
    pageSize = 10,
    showFollow = true
}: ArticleListClientProps) => {
    const t = useTranslations("articleList");
    const [page, setPage] = useState(initPage);
    const [articles, setArticles] = useState<ArticleList>(initArticles);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initArticles.length < initTotal);
    const [error, setError] = useState<string | null>(null);

    // Intersection Observer ref
    const observerRef = useRef<HTMLDivElement>(null);
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);

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
                        <div className="text-foreground text-sm">{t("loadMore")}</div>
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
                    <div className="text-muted-foreground text-sm">{t("allLoaded")}</div>
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
