"use client";

import { articleControllerFindAll } from "@/api";
import { ArticleListClient as SharedArticleListClient } from "@/components/shared";
import { ArticleList } from "@/types";

type TopicArticleListClientProps = {
  initArticles: ArticleList;
  initPage: number;
  initTotal: number;
  id: string;
  showFollow?: boolean;
  fetchParams: { query: { tagId: string; type?: "popular" | "latest" } };
};

export const TopicArticleListClient = (props: TopicArticleListClientProps) => {
  const cacheKey = `topic-${props.id}-${props.fetchParams.query.type || "popular"}`;

  return (
    <SharedArticleListClient
      initArticles={props.initArticles}
      showFollow={props.showFollow}
      initPage={props.initPage}
      initTotal={props.initTotal}
      fetchArticles={articleControllerFindAll}
      fetchParams={props.fetchParams}
      cacheKey={cacheKey}
    />
  );
};
