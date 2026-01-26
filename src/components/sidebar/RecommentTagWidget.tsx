"use server";

import { tagControllerFindAll } from "@/api"
import { Link } from "@/i18n/routing";
import { TagList } from "@/types"
import { getTranslations } from "next-intl/server"

export const RecommendTagWidget = async () => {
    const t = await getTranslations('sidebar');

    let tags: TagList = [];
    try {
        const { data } = await tagControllerFindAll({
            query: {
                page: 1,
                limit: 4
            }
        });
        tags = data?.data?.data || [];
    } catch (error) {
        console.error('Failed to fetch tags:', error);
        // 返回错误状态的组件
        return (
            <section className="rounded-xl py-4 px-2 bg-card">
                <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6  font-medium px-2 mb-3">
                    <span>{t('hotTopics')}</span>
                </div>
                <div className="text-center py-4 text-muted-foreground text-sm">
                    {t('loadError')}
                </div>
            </section>
        );
    }

    const tagCard = (tag: TagList[number]) => {
        return (
            <Link href={`/topic/${tag.id}`} key={tag.id} className="py-2 px-3 rounded-lg cursor-pointer hover:bg-primary/15 block">
                <div className="flex flex-col">
                    <div className="text-sm">
                        <span>#</span>
                        <span className=" font-bold leading-5">{tag.name}</span>
                    </div>
                    <div className="mt-1 text-secondary text-xs">
                        <span>{tag.articleCount} {t('posts')} / {tag.followCount} {t('members')}</span>
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <section className="rounded-xl py-4 px-2 bg-card">
            <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6  font-semibold px-2 mb-3">
                <span>{t('hotTopics')}</span>
            </div>
            {tags.map((tag) => tagCard(tag))}
            <div className="px-2 mt-2">
                <Link href="/topic" className="text-sm text-primary hover:text-primary/80 cursor-pointer">{t('viewMore', { defaultValue: '查看更多' })}</Link>
            </div>
        </section>
    )
}