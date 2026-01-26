"use client";

import { ArticleUserList } from "@/types";
import { ArticleListClient as SharedArticleListClient } from "@/components/shared";
import { articleControllerFindAll } from "@/api";

type TopicArticleListClientProps = {
    initArticles: ArticleUserList;
    initPage: number;
    initTotal: number;
    id: string;
    showFollow?: boolean;
    fetchParams: { query: { tagId: string, type?: string } };
};

export const TopicArticleListClient = (props: TopicArticleListClientProps) => {
    const cacheKey = `topic-${props.id}-${props.fetchParams.query.type || 'hot'}`;
    
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
