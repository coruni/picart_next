"use client";

import { tagControllerFindAll } from "@/api"
import { TagList } from "@/types"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

export const RecommendTagWidget = () => {
    const t = useTranslations('sidebar');
    const [tags, setTags] = useState<TagList>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const { data } = await tagControllerFindAll({
                    query: {
                        page: 1,
                        limit: 4
                    }
                });
                setTags(data?.data.data || []);
            } catch (error) {
                console.error('Failed to fetch tags:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, []);
    const tagCard = (tag: TagList[number]) => {
        return (
            <div key={tag.id} className="py-2 px-3 rounded-lg cursor-pointer hover:bg-primary/15">
                <div className="flex flex-col">
                    <div className="text-sm">
                        <span>#</span>
                        <span className=" font-bold leading-5">{tag.name}</span>
                    </div>
                    <div className="mt-1 text-secondary text-xs">
                        <span>{tag.articleCount} {t('posts')} / {tag.followCount} {t('members')}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <section className="rounded-xl py-4 px-2 bg-card">
                <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6  font-medium px-2 mb-3">
                    <span>{t('hotTopics')}</span>
                </div>
                <div className="animate-pulse space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="py-2 px-3">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>

            </section>
        );
    }
    return (
        <section className="rounded-xl py-4 px-2 bg-card">
            <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6  font-medium px-2 mb-3">
                <span>{t('hotTopics')}</span>
            </div>
            {tags.map((tag) => tagCard(tag))}
            <div className="px-2 mt-2">
                <span className="text-sm text-primary hover:text-primary/80 cursor-pointer">查看更多</span>
            </div>
        </section>
    )
}