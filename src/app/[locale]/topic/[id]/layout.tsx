import { ReactNode } from "react";
import Image from "next/image";
import { tagControllerFindOne } from "@/api";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { generateTagMetadata } from "@/lib/seo";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopicInfo, TopicTabs } from "@/components/topic";
interface TopicDetailLayoutProps {
    children: ReactNode;
    params: Promise<{ id: string; locale: string }>;
}
// 动态生成元数据
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string, id: string }>;
}): Promise<Metadata> {
    const { id, locale } = await params;
    const { data } = await tagControllerFindOne({ path: { id } });

    if (!data?.data) {
        return {
            title: "Tag Not Found",
        };
    }

    return generateTagMetadata(data.data, locale);
}

export default async function TopicDetailLayout({ children, params }: TopicDetailLayoutProps) {
    const { id } = await params;
    // 请求用户数据
    const { data } = await tagControllerFindOne({ path: { id } })
    const tag = data?.data;
    if (!tag) {
        notFound();
    }

    return (
        <>
            {/* 背景 */}
            <div className="fixed h-75 w-full z-0">
                <div className="absolute top-0 left-0 w-full z-2 bg-linear-to-b from-[#00000066] to-transparent h-20" />
                <Image quality={95} src={tag.background || tag.avatar || '/placeholder/topic_placeholder.png'} fill alt={`${tag.name} background image`} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 w-full z-2 bg-linear-to-t from-[#00000066] to-transparent h-25" />
            </div>

            {/* 页面内容 */}
            <div className="mt-75 w-full z-10 relative bg-border dark:bg-gray-800">
                {/* 标签信息 */}
                <TopicInfo tag={tag} />
                {/* 子页面内容 */}
                <div className="page-container pt-4!">
                    <div className="left-container">
                        {/* Tabs 导航 */}
                        <div className="px-8 h-14 flex items-center border-b border-border sticky top-[110px] bg-card z-5 rounded-t-xl">
                            <TopicTabs />
                        </div>
                        {children}
                    </div>
                    <div className="right-container">
                        {/* 侧边栏内容 */}
                        <Sidebar showArticleCreate={true} showRecommendTag={false} showRecommendUser={false} />
                    </div>
                </div>
            </div>
        </>
    );
}
