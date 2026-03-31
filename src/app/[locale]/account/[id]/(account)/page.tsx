import { ArticleListClient } from "@/components/account/ArticleList.client";
import { serverApi } from "@/lib/server-api";
import { ArticleList } from "@/types";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const { data } = await serverApi.articleControllerFindByAuthor({
    path: {
      id: id,
    },
  });
  return (
    <ArticleListClient
      initArticles={(data?.data.data as ArticleList) || []}
      initPage={2}
      initTotal={data?.data.meta.total || 0}
      showFollow={false}
      id={id}
    />
  );
}
