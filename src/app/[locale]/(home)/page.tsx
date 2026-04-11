import { ArticleListClient } from "@/components/home/ArticleList.client";
import { serverApi } from "@/lib/server-api";

export default async function HomePage() {
  const query = {
    page: 1,
    limit: 20,
    type: "popular" as const,
  };

  const initialData = await serverApi.articleControllerFindAll({
    query,
    cache: "no-store",
    next: { revalidate: 0 },
  });

  const articles = initialData?.data?.data?.data || [];
  const total = initialData?.data?.data.meta.total || 0;

  return (
    <ArticleListClient
      showFollow={false}
      initArticles={articles}
      initTotal={total}
      initPage={2}
    />
  );
}
