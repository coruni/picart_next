import { articleControllerFindByAuthor } from "@/api";
import { ArticleListClient } from "@/components/account/ArticleList.client";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const { data } = await articleControllerFindByAuthor({
    path: {
      id: id
    }
  })
  return (
    <ArticleListClient
      initArticles={data?.data.data! || []}
      initPage={2}
      initTotal={data?.data.meta.total!}
      showFollow={false}
      id={id} />
  );
}
