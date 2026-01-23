import { ReactNode } from "react";
import Image from "next/image";
import { userControllerFindOne } from "@/api";
import { notFound } from "next/navigation";

import { AccountInfo, AccountTabs } from "@/components/account";
import { Metadata } from "next";
import { generateAuthorMetadata } from "@/lib";
import { Sidebar } from "@/components/sidebar/Sidebar";
interface AccountLayoutProps {
    children: ReactNode;
    params: Promise<{ id: string; locale: string }>;
}
// 动态生成元数据
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string, id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const { data } = await userControllerFindOne({ path: { id } })
    return generateAuthorMetadata(data?.data!);
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
    const { id } = await params;
    // 请求用户数据
    const { data } = await userControllerFindOne({ path: { id } })
    const user = data?.data;
    if (!user) {
        notFound();
    }

    return (
        <>
            {/* 背景 */}
            <div className="fixed h-75 w-full z-0">
                <div className="absolute top-0 left-0 w-full z-2 bg-linear-to-b from-[#00000066] to-transparent h-20" />
                <Image quality={95} src={(user.background as string) || user.avatar || ''} fill alt={`${user.nickname || user.username} background image`} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 w-full z-2 bg-linear-to-t from-[#00000066] to-transparent h-25" />
            </div>

            {/* 页面内容 */}
            <div className="mt-75 w-full z-10 relative bg-border dark:bg-gray-800">
                {/* 用户信息 */}
                <AccountInfo user={user} />
                {/* 子页面内容 */}
                <div className="page-container pt-4!">
                    <div className="left-container">
                        {/* Tabs 导航 */}
                        <div className="px-10 h-14 flex items-center border-b border-border sticky top-[110px] bg-card z-5 rounded-t-xl">
                            <AccountTabs />
                        </div>
                        {children}
                    </div>
                    <div className="right-container">
                        {/* 侧边栏内容 */}
                        <Sidebar showArticleCreate={false} showRecommendTag={false} showRecommendUser={false} />
                    </div>
                </div>
            </div>
        </>
    );
}
