import { tagControllerFindAll } from "@/api";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TagListClient } from "@/components/topic/TopicList.client";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { generateTopicMetadata } from "@/lib/seo";

// 动态生成元数据
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return generateTopicMetadata(locale);
}

export default async function TopicPage() {
    const t = await getTranslations("topicPage");
    
    // 请求初始tag
    const { data } = await tagControllerFindAll({
        query: {
            page: 1,
            limit: 10
        }
    })

    return (
        <div className="page-container">
            <div className="left-container">
                <div className="px-4 h-14 flex items-center border-b rounded-t-xl border-border sticky top-[50px] bg-white dark:bg-gray-800 z-15">
                    <div className="h-full flex-1 flex items-center">
                        <span className="font-bold text-base pr-6">
                            {t("recommendedTopics")}
                        </span>
                    </div>
                </div>
                <TagListClient
                    initTags={data?.data.data || []}
                    initPage={2}
                    initTotal={data?.data.meta.total!}
                    pageSize={10}
                />
            </div>
            <div className="right-container">
                <Sidebar showAuthorInfo={false} showArticleCreate={false} showRecommendTag={false} />
            </div>
        </div>
    )
}