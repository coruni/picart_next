import { articleControllerFindByAuthor } from "@/api";
import { ArticleListClient } from "@/components/account/ArticleList.client";
import { ArticleList } from "@/types";

export default async function AccountHomePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const { data } = await articleControllerFindByAuthor({
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
