import { Sidebar } from "@/components/sidebar/Sidebar";
import { TagListClient } from "@/components/topic/TopicList.client";
import { generateTopicMetadata } from "@/lib/seo";
import { serverApi } from "@/lib/server-api";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
    const { data } = await serverApi.tagControllerFindAll({
        query: {
            page: 1,
            limit: 10
        },
        
    })

    return (
        <div className="page-container">
            <div className="left-container">
                <div className="top-header px-4 h-14 flex items-center border-b rounded-t-xl border-border sticky bg-card  z-15">
                    <div className="h-full flex-1 flex items-center">
                        <span className="font-bold text-base pr-6">
                            {t("recommendedTopics")}
                        </span>
                    </div>
                </div>
                <TagListClient
                    initTags={data?.data.data || []}
                    initPage={2}
                    initTotal={data?.data.meta.total || 0}
                    pageSize={10}
                    cacheKey="topic-list"
                />
            </div>
            <div className="right-container">
                <Sidebar showAuthorInfo={false} showArticleCreate={false} showRecommendTag={false} />
            </div>
        </div>
    )
}
