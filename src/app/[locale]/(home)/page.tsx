import { articleControllerFindAll } from "@/api";
import { ArticleListClient } from "@/components/home/ArticleList.client";

export default async function HomePage() {
  // SSR: 服务端获取第一页数据
  const initialData = await articleControllerFindAll({
    query: {
      page: 1,
      limit: 10,
    },
  })

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
