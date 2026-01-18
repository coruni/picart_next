import { bannerControllerFindActive } from "@/api";
import Image from "next/image";
import Link from "next/link";
import { LoginWidget } from "./LoadingWidget";
import { ArticleCreateWidget } from "./ArticleCreateWidget";
import { RecommendUserWidget } from "./RecommendUserWidget";
import { RecommendTagWidget } from "./RecommentTagWidget";

export async function Sidebar() {
  // SSR: 获取活跃的 Banner
  const response = await bannerControllerFindActive({});

  const banners = response.data?.data || [];

  return (
    <>
      {/* 登录 */}
      <LoginWidget />
      {/* 发帖 */}
      <ArticleCreateWidget />
      {/* 推荐用户 */}
      <RecommendUserWidget />
      {/* 热门话题 */}
      <RecommendTagWidget />
    </>

  );
}
