import { Sidebar } from "@/components/home/Sidebar";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { FeedTabs } from "@/components/home/FeedTabs";

export function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-60px)] relative flex">
      <div className="max-w-7xl mx-auto pt-4 flex flex-col flex-1">
        <div className="flex gap-6 flex-1">
          {/* 左侧内容区 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl flex-1">
            {/* 头部tabs */}
            <div className="px-6 h-14 flex items-center border-b border-border sticky top-0 bg-white dark:bg-gray-800 z-10">
              <FeedTabs />
            </div>
            {/* 内容区域 */}
            <div className="p-6">{children}</div>
          </div>

          {/* 右侧边栏 */}
          <div className="w-84">
            <div className="sticky space-y-4">
              <TrendingTopics />
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
