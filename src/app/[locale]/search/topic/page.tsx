import { SearchTopicListClient } from "@/components/search/SearchTopicListClient";
import { serverApi } from "@/lib/server-api";

type SearchTopicPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchTopicPage(props: SearchTopicPageProps) {
  const { q = "" } = await props.searchParams;
  const keyword = q.trim();

  const response = keyword
    ? await serverApi.tagControllerFindAll({
        query: {
          name: keyword,
          page: 1,
          limit: 10,
        },
      })
    : null;

  const tags = response?.data?.data?.data || [];
  const total = response?.data?.data?.meta?.total || 0;

  return (
    <div className="rounded-xl bg-card">
      <div className="p-4 font-semibold">
        <span>相关话题</span>
      </div>
      <div className="px-4 pb-4">
        <SearchTopicListClient
          key={keyword}
          initTags={tags}
          initPage={2}
          initTotal={total}
          keyword={keyword}
        />
      </div>
    </div>
  );
}