import { TopicArticleListClient } from "@/components/topic/TopicArticleList.client";
import { serverApi } from "@/lib/server-api";

type TopicDetailNewPageProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<{
    commentId?: string;
  }>;
};

export default async function TopicDetailNewPage(
  props: TopicDetailNewPageProps,
) {
  const { id } = await props.params;
  const sortType = "latest";

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
