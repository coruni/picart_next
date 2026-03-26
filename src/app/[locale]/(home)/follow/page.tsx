import { ArticleFollowList } from "@/components/home/ArticleFollowList.client";
import {
  buildAuthHeaders,
  getAuthDebugSnapshot,
  getExplicitAuthHeaders,
  TOKEN_COOKIE_NAME,
} from "@/lib/request-auth";
import { getServerCookie } from "@/lib/server-cookies";
import { serverApi } from "@/lib/server-api";
import { ArticleControllerFindAllResponse } from "@/types";

export default async function FollowPage() {
  let result: ArticleControllerFindAllResponse["data"] | undefined;
  const token = await getServerCookie(TOKEN_COOKIE_NAME);
  const requestHeaders = await buildAuthHeaders();
  const query = {
    limit: 10,
    page: 1,
    type: "following" as const,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][follow] article list request snapshot", {
      hasTokenCookie: !!token,
      ...getAuthDebugSnapshot(requestHeaders),
      ...query,
    });

    console.log("[auth][follow] article list request detail", {
      url: "/article",
      method: "GET",
      query,
      headers: getExplicitAuthHeaders(requestHeaders),
    });
  }

  if (token) {
    const response = await serverApi.articleControllerFindAll({
      query,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    result = response.data?.data;

    if (process.env.NODE_ENV === "development") {
      console.log("[auth][follow] article list request end", {
        status: response.response.status,
        ...getAuthDebugSnapshot(requestHeaders),
      });
    }
  }

  return (
    <ArticleFollowList
      initArticles={result?.data || []}
      initPage={2}
      initTotal={result?.meta?.total || 0}
    />
  );
}
