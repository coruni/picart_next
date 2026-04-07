import { Sidebar } from "@/components/sidebar/Sidebar";
import { ReactNode } from "react";

type RecommendUserLayoutProps = {
  children: ReactNode;
};

export default async function RecommendUserLayout({
  children,
}: RecommendUserLayoutProps) {
  return (
    <div className="page-container">
      {/* 左侧内容区 */}
      <div className="left-container">
        {children}
      </div>

      {/* 右侧边栏 */}
      <div className="right-container">
        <Sidebar
          showRecommendUser={false}
          showAuthorInfo={false}
          showArticleCreate={false}
          showRecommendTag
          showBanner
        />
      </div>
    </div>
  );
}
