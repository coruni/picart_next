import { TopicArticleListClient } from "@/components/topic/TopicArticleList.client";
import { serverApi } from "@/lib/server-api";

type TopicDetailPageProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<{
    commentId?: string;
  }>;
};

export default async function TopicDetailPage(props: TopicDetailPageProps) {
  const { id } = await props.params;
  const sortType = "popular";

  const { data } = await serverApi.articleControllerFindAll({
    query: {
      page: 1,
      limit: 10,
      tagId: Number(id),
      type: sortType,
    },
  });

  return (
    <TopicArticleListClient
      initArticles={data?.data.data || []}
      initPage={2}
      initTotal={data?.data.meta.total || 0}
      id={id}
      fetchParams={{
        query: {
          tagId: id,
          type: sortType,
        },
      }}
    />
  );
}
