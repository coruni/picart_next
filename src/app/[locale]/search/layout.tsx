import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchPanel } from "@/components/search/SearchPanel";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Banner } from "@/components/ui/Banner";
import { getPublicCategories } from "@/lib";
import { ReactNode } from "react";

type SearchLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function SearchLayout(props: SearchLayoutProps) {
  const { locale } = await props.params;
  const categories = await getPublicCategories();

  return (
    <div className="page-container">
      <div className="left-container bg-transparent! space-y-4">
        <div className="bg-card rounded-xl relative">
          <div className="top-header sticky py-3 z-10 bg-card rounded-t-xl">
            <SearchHeader categories={categories} className="w-full px-6" />
            <SearchPanel />
          </div>
          <div className="p-6">
            <Banner className="aspect-23/7" />
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
