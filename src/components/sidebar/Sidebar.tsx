import { cn } from "@/lib";
import { getCurrentUser } from "@/lib/current-user";
import { ArticleDetail } from "@/types";
import { Banner } from "../ui/Banner";
import { ArticleCreateWidget } from "./ArticleCreateWidget";
import { AuthorInfoWidget } from "./AuthorInfoWidget";
import { CollectionListWidget } from "./CollectionListWidget";
import { HotSearch } from "./HotSearch";
import { LoginWidget } from "./LoadingWidget";
import { RecommendUserWidget } from "./RecommendUserWidget";
import { RecommendTagWidget } from "./RecommentTagWidget";
import { SearchHistory } from "./SearchHistory";
import { SiteContactWidget } from "./SiteContactWidget";

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
  showSiteContact?: boolean;
  showCollectionList?: boolean;
  collectionId?: number;
  collectionName?: string;
  currentArticleId?: number;
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
  showSiteContact = true,
  showCollectionList = false,
  collectionId,
  collectionName,
  currentArticleId,
}: SidebarProps) {
  const currentUser = await getCurrentUser();
  const shouldShowBanner =
    showBanner && (randomBanner ? Math.random() >= 0.5 : true);

  const sidebarItems = [
    showArticleCreate && currentUser ? (
      <ArticleCreateWidget key="article-create" />
    ) : null,

    showSearchHistory ? <SearchHistory key="search-history" /> : null,
    showHotSearch ? <HotSearch key="hot-search" /> : null,
    shouldShowBanner ? (
      <Banner key="sidebar-banner" className=" aspect-8/3 w-full rounded-xl" />
    ) : null,
    showRecommendUser ? <RecommendUserWidget key="recommend-user" /> : null,
    showRecommendTag ? <RecommendTagWidget key="recommend-tag" /> : null,
  ].filter(Boolean);

  return (
    <>
      <div className="space-y-4">
        {showLogin && <LoginWidget />}

        {showAuthorInfo && author && <AuthorInfoWidget author={author} />}

        {showCollectionList && collectionId && author && (
          <CollectionListWidget
            userId={author.id}
            collectionId={collectionId}
            collectionName={collectionName}
            currentArticleId={currentArticleId}
          />
        )}

        {sidebarItems}
      </div>
      {/* Sticky element */}
      {showSiteContact && (
        <div className={cn("sticky self-start pt-4", "top-header-tabs")}>
          <SiteContactWidget />
        </div>
      )}
    </>
  );
}
