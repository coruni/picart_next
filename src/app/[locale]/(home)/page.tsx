import { ArticleListClient } from "@/components/home/ArticleList.client";
import {
  buildAuthHeaders,
  getAuthDebugSnapshot,
  getExplicitAuthHeaders,
} from "@/lib/request-auth";
import { serverApi } from "@/lib/server-api";

export default async function HomePage() {
  const requestHeaders = await buildAuthHeaders();
  const query = {
    page: 1,
    limit: 10,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][home] article list request start", {
      ...getAuthDebugSnapshot(requestHeaders),
      ...query,
    });

    console.log("[auth][home] article list request detail", {
      url: "/article",
      method: "GET",
      query,
      headers: getExplicitAuthHeaders(requestHeaders),
    });
  }

  const initialData = await serverApi.articleControllerFindAll({
    query,
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][home] article list request end", {
      status: initialData.response.status,
      ...getAuthDebugSnapshot(requestHeaders),
    });
  }

  const articles = initialData?.data?.data?.data || [];
  const total = initialData?.data?.data.meta.total || 0;

  return (
    <ArticleListClient
      initArticles={articles}
      initTotal={total}
      initPage={2}
    />
  );
}
