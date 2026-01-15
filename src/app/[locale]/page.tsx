import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { FeedList } from "@/components/home/FeedList";
import { Sidebar } from "@/components/home/Sidebar";
import { QuickActions } from "@/components/home/QuickActions";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { FeedListSkeleton } from "@/components/home/FeedListSkeleton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="min-h-screen ">
      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧内容区 */}
          <div className="lg:col-span-8 space-y-6">
            {/* 快速操作区 */}
            <QuickActions />

            {/* 动态列表 */}
            <Suspense fallback={<FeedListSkeleton />}>
              <FeedList />
            </Suspense>
          </div>

          {/* 右侧边栏 */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* 热门话题 */}
              <TrendingTopics />

              {/* 侧边栏 */}
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
