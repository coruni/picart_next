import { bannerControllerFindActive } from "@/api";
import { LoginWidget } from "./LoadingWidget";
import { ArticleCreateWidget } from "./ArticleCreateWidget";
import { RecommendUserWidget } from "./RecommendUserWidget";
import { RecommendTagWidget } from "./RecommentTagWidget";
import { AuthorInfoWidget } from "./AuthorInfoWidget";
import { ArticleDetail } from "@/types";
type SidebarProps = {
  showLogin?: boolean;
  showArticleCreate?: boolean;
  showRecommendUser?: boolean;
  showRecommendTag?: boolean;
  showAuthorInfo?: boolean;
  author?: ArticleDetail['author']
}

export async function Sidebar({
  showLogin = true,
  showArticleCreate = true,
  showRecommendUser = true,
  showRecommendTag = true,
  showAuthorInfo = false,
  author
}: SidebarProps) {
  // SSR: 获取活跃的 Banner
  const response = await bannerControllerFindActive({});
  const banners = response.data?.data || [];

  return (
    <div className="space-y-4 relative">
      {/* 登录 */}
      {showLogin && (
        <LoginWidget />
      )}
      {/* 作者信息 */}
      {showAuthorInfo && author &&(
        <AuthorInfoWidget author={author}/>
      )}

      {/* 发帖 */}
      {showArticleCreate && (
        <ArticleCreateWidget />
      )}
      {/* 推荐用户 */}
      {showRecommendUser && (
        <RecommendUserWidget />
      )}
      {/* 热门话题 */}
      {showRecommendTag && (
        <RecommendTagWidget />
      )}
    </div>


  );
}
