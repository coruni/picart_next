import { articleControllerFindAll } from "@/api";
import { ArticleFollowList } from "@/components/home/ArticleFollowList.client";
import { getServerCookie } from "@/lib/server-cookies";
import { ArticleControllerFindAllResponse } from "@/types";

export default async function FollowPage() {
  let result: ArticleControllerFindAllResponse['data'] | undefined;
  const token = await getServerCookie('auth-token');
  
  if (token) {
    const { data } = await articleControllerFindAll({
      query: {
        limit: 10,
        page: 1,
        type: 'following'
      }
    });
    result = data?.data;
  }

  return (
    <ArticleFollowList
      initArticles={result?.data || []}
      initPage={2}
      initTotal={result?.meta?.total || 0}
    />
  );
}
