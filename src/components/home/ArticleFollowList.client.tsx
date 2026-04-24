"use client";

import { ArticleList } from "@/types";
import {
  EmptyState,
  ArticleListClient as SharedArticleListClient,
} from "@/components/shared";
import { articleControllerFindAll } from "@/api";
import { useUserStore } from "@/stores";
import { openLoginDialog } from "@/lib/modal-helpers";
import { Button } from "../ui/Button";
import { useTranslations } from "next-intl";
import { FollowedTopicsWidget } from "./FollowedTopicsWidget";

type ArticleListClientProps = {
  initArticles: ArticleList;
  initPage: number;
  initTotal: number;
  showFollow?: boolean;
};

export const ArticleFollowList = (props: ArticleListClientProps) => {
  const t = useTranslations("sidebar");
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  return (
    <>
      {isAuthenticated ? (
        <>
          <FollowedTopicsWidget />
          <SharedArticleListClient
            showFollow={props.showFollow}
            initArticles={props.initArticles}
            initPage={props.initPage}
            initTotal={props.initTotal}
            fetchArticles={articleControllerFindAll}
            cacheKey="home-follow-articles"
          />
        </>
      ) : (
        <EmptyState
          message={t("loginPrompt")}
          customButton={
            <Button onClick={openLoginDialog} className="rounded-full">
              {t("login")}
            </Button>
          }
        />
      )}
    </>
  );
};
