"use client";

import { ArticleList } from "@/types";
import { ArticleListClient as SharedArticleListClient } from "@/components/shared";
import { articleControllerFindAll } from "@/api";

type ArticleListClientProps = {
  initArticles: ArticleList;
  initPage: number;
  initTotal: number;
  showFollow?: boolean;
};

export const ArticleListClient = (props: ArticleListClientProps) => {
  return (
    <SharedArticleListClient
      showFollow={props.showFollow}
      initArticles={props.initArticles}
      initPage={props.initPage}
      initTotal={props.initTotal}
      fetchArticles={articleControllerFindAll}
      cacheKey="home-articles"
    />
  );
};
