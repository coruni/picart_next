"use client";

import { ArticleList } from "@/types";
import { EmptyState, ArticleListClient as SharedArticleListClient } from "@/components/shared";
import { articleControllerFindAll } from "@/api";
import { useUserStore } from "@/stores";
import { openLoginDialog } from "@/lib/modal-helpers";
import { Button } from "../ui/Button";

type ArticleListClientProps = {
    initArticles: ArticleList;
    initPage: number;
    initTotal: number;
    showFollow?: boolean;
};

export const ArticleFollowList = (props: ArticleListClientProps) => {
    const isAuthenticated = useUserStore((state) => state.isAuthenticated)
    return (
        <>
            {isAuthenticated ? (
                <SharedArticleListClient
                    showFollow={props.showFollow}
                    initArticles={props.initArticles}
                    initPage={props.initPage}
                    initTotal={props.initTotal}
                    fetchArticles={articleControllerFindAll}
                />
            ) : (
                <EmptyState message="登录查看更多精彩内容" customButton={
                    <Button onClick={openLoginDialog} className="rounded-full">去登陆</Button>
                } />
            )}
        </>
    );
};
