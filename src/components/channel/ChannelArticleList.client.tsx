"use client";

import { ArticleList } from "@/types";
import { ArticleListClient as SharedArticleListClient } from "@/components/shared";
import { articleControllerFindAll } from "@/api";

type ChannelArticleListClientProps = {
    initArticles: ArticleList;
    initPage: number;
    initTotal: number;
    categoryId: string;
    showFollow?: boolean;
};

export const ChannelArticleListClient = (props: ChannelArticleListClientProps) => {
    const cacheKey = `channel-${props.categoryId}-articles`;
    
    return (
        <SharedArticleListClient
            initArticles={props.initArticles}
            showFollow={props.showFollow}
            initPage={props.initPage}
            initTotal={props.initTotal}
            fetchArticles={articleControllerFindAll}
            fetchParams={{ 
                query: { 
                    categoryId: Number(props.categoryId) 
                } 
            }}
            cacheKey={cacheKey}
        />
    );
};
