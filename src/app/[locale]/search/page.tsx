import { SearchArticleListClient } from "@/components/search/SearchArticleList.client";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("searchPage");
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
        <span>{t("relatedArticles")}</span>
      </div>
      <div className="px-4 md:px-6 pb-6">
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
