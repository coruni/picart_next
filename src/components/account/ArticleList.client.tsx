"use client";

import { ArticleUserList } from "@/types";
import { ArticleListClient as SharedArticleListClient } from "@/components/shared";
import { articleControllerFindByAuthor } from "@/api";

type ArticleListClientProps = {
    initArticles: ArticleUserList;
    initPage: number;
    initTotal: number;
    id: string;
    showFollow?: boolean;
};

export const ArticleListClient = (props: ArticleListClientProps) => {
    return (
        <SharedArticleListClient
            initArticles={props.initArticles}
            showFollow={props.showFollow}
            initPage={props.initPage}
            initTotal={props.initTotal}
            fetchArticles={articleControllerFindByAuthor}
            fetchParams={{ path: { id: props.id } }}
        />
    );
};
