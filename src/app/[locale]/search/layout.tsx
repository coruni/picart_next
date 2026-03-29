import { Sidebar } from "@/components/sidebar/Sidebar";
import { getPublicCategories } from "@/lib";
import { ReactNode } from "react";
import { SearchFeedTabs } from "./SearchFeedTabs";
import { SearchHeader } from "./searchHeader";

type SearchLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function SearchLayout(props: SearchLayoutProps) {
  await props.params;
  const categories = await getPublicCategories();

  // 构建搜索参数
  const query = {

  }

  return (
    <div className="page-container">
      <div className="left-container bg-transparent!">
        <div className="top-header rounded-xl sticky py-3 bg-card z-10">
          <SearchHeader categories={categories} className="w-full px-6" />
          <div className="w-full h-12 leading-12 px-6 mt-2 border-b border-border">
            <SearchFeedTabs className="w-full " />
          </div>
        </div>

        {props.children}
      </div>
      <div className="right-container">
        <Sidebar />
      </div>
    </div>
  );
}
