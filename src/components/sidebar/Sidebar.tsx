import { ArticleDetail } from "@/types";
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
  author,
}: SidebarProps) {
  return (
    <div className="relative space-y-4">
      {showLogin && <LoginWidget />}

      {showAuthorInfo && author && <AuthorInfoWidget author={author} />}

      {showArticleCreate && <ArticleCreateWidget />}

      {showSearchHistory && <SearchHistory />}

      {showHotSearch && <HotSearch />}

      {showRecommendUser && <RecommendUserWidget />}

      {showRecommendTag && <RecommendTagWidget />}
    </div>
  );
}
