import { cn } from "@/lib";
import { getCurrentUser } from "@/lib/current-user";
import { serverApi } from "@/lib/server-api";
import { ArticleDetail, UserProfile } from "@/types";
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
import { UserAchievementWidget } from "./UserAchievementWidget";
import { UserInfoWidget } from "./UserInfoWidget";
type SidebarProps = {
  showLogin?: boolean;
  showArticleCreate?: boolean;
  showRecommendUser?: boolean;
  showRecommendTag?: boolean;
  showAuthorInfo?: boolean;
  showSearchHistory?: boolean;
  showHotSearch?: boolean;
  showBanner?: boolean;
  showUserInfo?: boolean;
  showUserAchievements?: boolean;
  randomBanner?: boolean;
  author?: ArticleDetail["author"] | UserProfile;
  showSiteContact?: boolean;
  showCollectionList?: boolean;
  collectionId?: number;
  collectionName?: string;
  currentArticleId?: number;
  tabSticky?: boolean;
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
  showUserAchievements = false,
  author,
  showSiteContact = true,
  showCollectionList = false,
  showUserInfo = false,
  collectionId,
  collectionName,
  currentArticleId,
  tabSticky = false,
}: SidebarProps) {
  const currentUser = await getCurrentUser();
  const fetchedAchievements =
    showUserAchievements && currentUser
      ? (
          await serverApi.decorationControllerGetUserDecorations({
            path: { userId: String(currentUser.id) },
            query: {
              type: "ACHIEVEMENT_BADGE",
              page: 1,
              limit: 11,
            },
          })
        )?.data?.data || {
          data: [],
          meta: {
            total: 0,
            page: 0,
            limit: 0,
            totalPages: 0,
          },
        }
      : { data: [], meta: { total: 0, page: 0, limit: 0, totalPages: 0 } };

  const shouldShowBanner = showBanner;

  const sidebarItems = [
    showArticleCreate && currentUser && (
      <ArticleCreateWidget key="article-create" />
    ),
    showSearchHistory && <SearchHistory key="search-history" />,
    showHotSearch && <HotSearch key="hot-search" />,
    shouldShowBanner && (
      <Banner key="sidebar-banner" className="aspect-8/3 w-full rounded-xl" probability={0.4}/>
    ),
    showRecommendUser && <RecommendUserWidget key="recommend-user" />,
    showRecommendTag && <RecommendTagWidget key="recommend-tag" />,
    showUserInfo && (
      <UserInfoWidget author={author as UserProfile} key="userinfo" />
    ),
  ].filter(Boolean);

  return (
    <>
      <div className="space-y-4">
        {showLogin && <LoginWidget />}

        {showAuthorInfo && author && (
          <AuthorInfoWidget author={author as ArticleDetail["author"]} />
        )}

        {showCollectionList && collectionId && author && (
          <CollectionListWidget
            userId={author.id}
            collectionId={collectionId}
            collectionName={collectionName}
            currentArticleId={currentArticleId}
          />
        )}

        {sidebarItems}
        {showUserAchievements && (
          <UserAchievementWidget
            achievements={fetchedAchievements.data}
            total={fetchedAchievements.meta.total}
          />
        )}
      </div>
      {/* Sticky element */}
      {showSiteContact && (
        <div
          className={cn(
            "sticky self-start pt-4",
            tabSticky ? "top-header-tabs" : "top-header",
          )}
        >
          <SiteContactWidget />
        </div>
      )}
    </>
  );
}
