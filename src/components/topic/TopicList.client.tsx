"use client";

import { TagList } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { tagControllerFindAll } from "@/api";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { TagCard } from "./TopicCard";

type TagListClientProps = {
    initTags: TagList;
    initPage: number;
    initTotal: number;
    pageSize?: number;
};

export const TagListClient = ({
    initTags,
    initPage,
    initTotal,
    pageSize = 10,
}: TagListClientProps) => {
    const t = useTranslations("tagList");
    const [page, setPage] = useState(initPage);
    const [tags, setTags] = useState<TagList>(initTags);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initTags.length < initTotal);
    const [error, setError] = useState<string | null>(null);

    // Intersection Observer ref
    const observerRef = useRef<HTMLDivElement>(null);
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);

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