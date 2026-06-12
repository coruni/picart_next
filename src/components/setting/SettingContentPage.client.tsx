"use client";

import {
  articleControllerCancelDislikeArticle,
  articleControllerGetDislikedArticles,
  type ArticleControllerGetDislikedArticlesResponse,
} from "@/api";
import {
  DropdownMenu,
  InfiniteScrollStatus,
  type MenuItem,
} from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { Link } from "@/i18n/routing";
import { getErrorMessage, showToast } from "@/lib";
import { MoreHorizontal, ThumbsDown, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

type DislikedArticleItem =
  ArticleControllerGetDislikedArticlesResponse["data"]["data"][number];

function SettingContentItem({
  article,
  onRemove,
}: {
  article: DislikedArticleItem;
  onRemove: (article: DislikedArticleItem) => Promise<void>;
}) {
  const locale = useLocale();
  const t = useTranslations("setting.content");
  const summary = article.summary?.trim() || article.content?.trim() || "-";
  const menuItems: MenuItem[] = [
    {
      label: t("actions.cancelDislike"),
      icon: <Trash2 size={16} />,
      className: "text-red-500",
      confirmDialog: {
        enabled: true,
        title: t("confirmTitle"),
        description: t("confirmDescription", { title: article.title }),
        confirmText: t("actions.confirm"),
        cancelText: t("actions.cancel"),
      },
      onClick: () => onRemove(article),
    },
  ];

  return (
    <div className="border-b border-border px-3 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <Link href={`/account/${article.author.id}`} className="shrink-0">
          <Avatar
            url={article.author.avatar}
            frameUrl={
              article.author.equippedDecorations?.AVATAR_FRAME?.imageUrl
            }
            className="size-10"
            alt={article.author.nickname || article.author.username}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/article/${article.id}`}
                className="line-clamp-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                {article.title}
              </Link>
              <div className="mt-1 text-xs text-muted-foreground">
                <Link
                  href={`/account/${article.author.id}`}
                  className="transition-colors hover:text-primary"
                >
                  {article.author.nickname || article.author.username}
                </Link>
                <span className="mx-1">·</span>
                <span>
                  {new Date(article.createdAt).toLocaleDateString(locale)}
                </span>
              </div>
            </div>

            <DropdownMenu
              title={t("menuTitle")}
              items={menuItems}
              trigger={
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MoreHorizontal size={16} />
                </button>
              }
              className="shrink-0"
              menuClassName="top-8"
            />
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {summary}
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-600">
              <ThumbsDown size={12} />
              {t("disliked")}
            </span>
            <span>{t("stats.views", { count: article.views })}</span>
            <span>{t("stats.comments", { count: article.commentCount })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingContentPage() {
  const t = useTranslations("setting.content");
  const [page, setPage] = useState(2);
  const [articles, setArticles] = useState<DislikedArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadArticles = useCallback(
    async (targetPage: number, replace = false) => {
      if (loading) {
        return;
      }

      if (!replace && !hasMore) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await articleControllerGetDislikedArticles({
          query: {
            page: targetPage,
            limit: 10,
          },
        });

        const payload = response.data?.data;
        const nextArticles = payload?.data || [];
        const total = payload?.meta?.total || 0;

        setArticles((current) =>
          replace ? nextArticles : [...current, ...nextArticles],
        );
        setPage(targetPage + 1);

        const loadedCount = replace
          ? nextArticles.length
          : articles.length + nextArticles.length;
        setHasMore(loadedCount < total && nextArticles.length > 0);
      } catch (nextError) {
        console.error("Failed to load disliked articles:", nextError);
        if (replace) {
          setArticles([]);
          setHasMore(false);
        }
        setError(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [articles.length, hasMore, loading, t],
  );

  useEffect(() => {
    let mounted = true;

    const loadInitialArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await articleControllerGetDislikedArticles({
          query: {
            page: 1,
            limit: 10,
          },
        });

        if (!mounted) {
          return;
        }

        const payload = response.data?.data;
        const nextArticles = payload?.data || [];
        const total = payload?.meta?.total || 0;

        setArticles(nextArticles);
        setPage(2);
        setHasMore(nextArticles.length < total);
      } catch (nextError) {
        if (!mounted) {
          return;
        }

        console.error("Failed to load disliked articles:", nextError);
        setArticles([]);
        setHasMore(false);
        setError(t("loadFailed"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialArticles();

    return () => {
      mounted = false;
    };
  }, [t]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        void loadArticles(page);
      }
    },
  });

  const handleRemove = async (article: DislikedArticleItem) => {
    if (removingId === article.id) {
      return;
    }

    setRemovingId(article.id);

    try {
      await articleControllerCancelDislikeArticle({
        path: { id: String(article.id) },
      });
      setArticles((prev) => prev.filter((item) => item.id !== article.id));
      showToast(t("removeSuccess"));
    } catch (nextError) {
      console.error("Failed to cancel dislike article:", nextError);
      showToast(getErrorMessage(nextError, t("removeFailed")));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-3 py-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {articles?.map((article) => (
          <SettingContentItem
            key={article.id}
            article={article}
            onRemove={handleRemove}
          />
        ))}

        <InfiniteScrollStatus
          observerRef={observerRef}
          hasMore={hasMore}
          loading={loading}
          error={error}
          isEmpty={articles.length === 0}
          onRetry={() =>
            loadArticles(
              articles.length === 0 ? 1 : page,
              articles.length === 0,
            )
          }
          loadingText={t("loading")}
          idleText={t("loadMore")}
          retryText={t("retry")}
          allLoadedText={t("allLoaded")}
          emptyText={t("emptyDescription")}
          containerClassName="px-3 py-4"
          loadingClassName="text-secondary"
          idleTextClassName="text-secondary"
          endClassName="text-muted-foreground"
          emptyClassName="text-muted-foreground"
        />
      </div>
    </div>
  );
}
