import { ArticleDetail } from "@/types";
import { Banner } from "../ui/Banner";
import { ArticleCreateWidget } from "./ArticleCreateWidget";
import { AuthorInfoWidget } from "./AuthorInfoWidget";
import { HotSearch } from "./HotSearch";
import { LoginWidget } from "./LoadingWidget";
import { RecommendUserWidget } from "./RecommendUserWidget";
import { RecommendTagWidget } from "./RecommentTagWidget";
import { SearchHistory } from "./SearchHistory";

type SidebarProps = {
  showLogin?: boolean;
  showArticleCreate?: boolean;
  showRecommendUser?: boolean;
  showRecommendTag?: boolean;
  showAuthorInfo?: boolean;
  showSearchHistory?: boolean;
  showHotSearch?: boolean;
  showBanner?: boolean;
  randomBanner?: boolean;
  author?: ArticleDetail["author"];
};

export async function Sidebar({
  showLogin = true,
  showArticleCreate = true,
  showRecommendUser = true,
  showRecommendTag = true,
  showAuthorInfo = false,
  showSearchHistory = false,
  showHotSearch = false,
  showBanner = true,
  randomBanner = true,
  author,
}: SidebarProps) {
  const shouldShowBanner =
    showBanner && (randomBanner ? Math.random() >= 0.5 : true);

  const sidebarItems = [
    showArticleCreate ? <ArticleCreateWidget key="article-create" /> : null,
   
    showSearchHistory ? <SearchHistory key="search-history" /> : null,
    showHotSearch ? <HotSearch key="hot-search" /> : null,
     shouldShowBanner ? (
      <Banner key="sidebar-banner" className=" aspect-8/3 w-full rounded-xl" />
    ) : null,
    showRecommendUser ? <RecommendUserWidget key="recommend-user" /> : null,
    showRecommendTag ? <RecommendTagWidget key="recommend-tag" /> : null,
  ].filter(Boolean);

  return (
    <div className="relative space-y-4">
      {showLogin && <LoginWidget />}

      {showAuthorInfo && author && <AuthorInfoWidget author={author} />}

      {sidebarItems}
    </div>
  );
}
