import { articleControllerFindAll } from "@/api";
import { FeedCard } from "./FeedCard";
import type { ArticleList } from "@/types";

export async function FeedList() {
  // SSR: 在服务端获取数据
  const response = await articleControllerFindAll({
    
  });

  const articles = response.data?.data.data || [];

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无内容
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <FeedCard key={article.id} article={article} />
      ))}
    </div>
  );
}
