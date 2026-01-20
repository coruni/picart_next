import { ArticleFollowList } from "@/components/home/ArticleFollowList.client";

export default async function FollowPage() {

  return (
    <ArticleFollowList initArticles={[]} initPage={0} initTotal={0} />
  );
}
