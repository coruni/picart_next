import { SearchArticleListClient } from "@/components/search/SearchArticleListClient";
import { serverApi } from "@/lib/server-api";

type SearchPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function SearchPage(props: SearchPageProps) {
  const { q = "", category } = await props.searchParams;
  const keyword = q.trim();

  const response = keyword
    ? await serverApi.articleControllerSearch({
        query: {
          keyword,
          page: 1,
          limit: 10,
          ...(category && { categoryId: Number(category) }),
          sortBy: "relevance",
        },
      })
    : null;

  const articles = response?.data?.data?.data || [];
  const total = response?.data?.data?.meta?.total || 0;

  return (
    <div className="rounded-xl bg-card">
      <div className="p-4 font-semibold">
        <span>相关帖子</span>
      </div>
      <div className="px-6 pb-6">
        <SearchArticleListClient
          key={`${keyword}-${category || ""}`}
          initArticles={articles}
          initPage={2}
          initTotal={total}
          keyword={keyword}
          categoryId={category}
        />
      </div>
    </div>
  );
}
