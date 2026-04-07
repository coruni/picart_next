import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchPanel } from "@/components/search/SearchPanel";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Banner } from "@/components/ui/Banner";
import { getPublicCategories } from "@/lib";
import { ReactNode, Suspense } from "react";

type SearchLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function SearchLayout(props: SearchLayoutProps) {
  await props.params;
  const categories = await getPublicCategories();

  return (
    <div className="page-container">
      <div className="left-container bg-transparent! space-y-4">
        <div className="relative space-y-4">
          <div className="top-header pt-4 sticky z-10  rounded-xl bg-card">
            <Suspense fallback={<div className="h-14 w-full px-6" />}>
              <SearchHeader categories={categories} className="w-full px-6" />
            </Suspense>
            <Suspense fallback={<div className="h-12 w-full" />}>
              <SearchPanel />
            </Suspense>
          </div>

          <div className="rounded-xl bg-card p-6">
            <Banner className="aspect-23/7" />
          </div>

          {props.children}
        </div>
      </div>
      <div className="right-container">
        <Sidebar
          showRecommendUser={false}
          showAuthorInfo={false}
          showArticleCreate={false}
          showRecommendTag={false}
          showSearchHistory
          showHotSearch
        />
      </div>
    </div>
  );
}
