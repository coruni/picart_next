import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { FeedTabs } from "@/components/home/FeedTabs";

interface HomeLayoutProps {
  children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="page-container">
      {/* 左侧内容区 */}
      <div className="left-container">
        {/* 头部tabs - 滚动时吸顶在 header 下方 (header 高度 60px) */}
        <div className="px-6 h-14 flex items-center border-b rounded-t-xl border-border sticky top-[60px] bg-white dark:bg-gray-800 z-10">
          <FeedTabs />
        </div>
        {/* 内容区域 - 只有这里会根据路由变化 */}
        {children}
      </div>

      {/* 右侧边栏 - 切换时不会重新渲染 */}
      <div className="right-container">
        <Sidebar />
      </div>
    </div>
  );
}
