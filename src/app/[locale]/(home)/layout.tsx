import { ReactNode } from "react";
import { Sidebar } from "@/components/home/Sidebar";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { FeedTabs } from "@/components/home/FeedTabs";

interface HomeLayoutProps {
  children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-60px)] relative flex">
      <div className="max-w-7xl mx-auto pt-4 flex flex-col flex-1">
        <div className="flex gap-6 flex-1">
          {/* 左侧内容区 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl flex-1">
            {/* 头部tabs - 切换时不会重新渲染 */}
            <div className="px-6 h-14 flex items-center border-b border-border sticky top-0 bg-white dark:bg-gray-800 z-10">
              <FeedTabs />
            </div>
            {/* 内容区域 - 只有这里会根据路由变化 */}
            <div className="p-6">{children}</div>
          </div>

          {/* 右侧边栏 - 切换时不会重新渲染 */}
          <div className="w-84">
            <div className="sticky top-4 space-y-4">
              <TrendingTopics />
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
