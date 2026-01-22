"use client";

import { ArticleUserList } from "@/types";
import { ArticleListClient as SharedArticleListClient } from "@/components/shared";
import { articleControllerGetFavoritedArticles, ArticleControllerGetFavoritedArticlesResponse } from "@/api";
type FavoriteArticleList = NonNullable<ArticleControllerGetFavoritedArticlesResponse['data']['data']>
type FavoriteArticleListClientProps = {
    initArticles: ArticleUserList | FavoriteArticleList;
    initPage: number;
    initTotal: number;
    id: string;
    showFollow?: boolean;
};

export const FavoriteArticleList = (props: FavoriteArticleListClientProps) => {
    return (
        <SharedArticleListClient
            initArticles={props.initArticles}
            showFollow={props.showFollow}
            initPage={props.initPage}
            initTotal={props.initTotal}
            fetchArticles={articleControllerGetFavoritedArticles}
            fetchParams={{ path: { id: props.id } }}
        />
    );
};
