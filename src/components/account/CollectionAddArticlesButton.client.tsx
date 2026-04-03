"use client";

import {
  articleControllerFindByAuthor,
  collectionControllerAddToCollection,
  collectionControllerCheckArticleInCollections,
  collectionControllerRemoveFromCollection,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useRouter } from "@/i18n/routing";
import { cn, formatShortDate } from "@/lib";
import type { ArticleUserList } from "@/types";
import { Check, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getImageUrl } from "@/types/image";

type CollectionAddArticlesButtonProps = {
  collectionId: number;
  currentUserId: string;
};

type AuthorArticle = ArticleUserList[number];

const PAGE_SIZE = 12;

export function CollectionAddArticlesButton({
  collectionId,
  currentUserId,
}: CollectionAddArticlesButtonProps) {
  const t = useTranslations("accountCollectionList");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [articles, setArticles] = useState<AuthorArticle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [existingIds, setExistingIds] = useState<number[]>([]);

  const existingIdSet = useMemo(() => new Set(existingIds), [existingIds]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const addIds = useMemo(
    () => selectedIds.filter((id) => !existingIdSet.has(id)),
    [existingIdSet, selectedIds],
  );
  const removeIds = useMemo(
    () => existingIds.filter((id) => !selectedIdSet.has(id)),
    [existingIds, selectedIdSet],
  );
  const hasChanges = addIds.length > 0 || removeIds.length > 0;

  const loadArticles = useCallback(
    async (targetPage: number, nextKeyword: string, append: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const response = await articleControllerFindByAuthor({
          path: { id: currentUserId },
          query: {
            page: targetPage,
            limit: PAGE_SIZE,
            keyword: nextKeyword || undefined,
          },
        });

        const nextArticles =
          (response.data?.data?.data as AuthorArticle[] | undefined) || [];
        const total = response.data?.data?.meta?.total || 0;

        const checkResponses = await Promise.all(
          nextArticles.map(async (article) => {
            const checkResponse =
              await collectionControllerCheckArticleInCollections({
                path: { articleId: article.id },
              });
            const collections = checkResponse.data?.data?.collections || [];
            const inCurrentCollection = collections.some(
              (item) => Number(item.id || 0) === Number(collectionId),
            );

            return inCurrentCollection ? article.id : null;
          }),
        );

        const checkedIds = checkResponses.filter(
          (value): value is number => typeof value === "number",
        );

        setArticles((prev) =>
          append ? [...prev, ...nextArticles] : nextArticles,
        );
        setExistingIds((prev) => {
          const nextExistingIds = append
            ? Array.from(new Set([...prev, ...checkedIds]))
            : checkedIds;

          setSelectedIds((currentSelectedIds) =>
            append
              ? Array.from(new Set([...currentSelectedIds, ...checkedIds]))
              : checkedIds,
          );

          return nextExistingIds;
        });
        setPage(targetPage);
        setHasMore(targetPage * PAGE_SIZE < total);
      } catch (loadError) {
        console.error("Failed to load author articles:", loadError);
        setError(t("addArticlesDialog.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [collectionId, currentUserId, t],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadArticles(1, keyword, false);
  }, [keyword, loadArticles, open]);

  const toggleSelected = (articleId: number) => {
    setSelectedIds((prev) =>
      prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId],
    );
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await Promise.all([
        ...addIds.map((articleId) =>
          collectionControllerAddToCollection({
            path: {
              id: collectionId,
              articleId,
            },
          }),
        ),
        ...removeIds.map((articleId) =>
          collectionControllerRemoveFromCollection({
            path: {
              id: collectionId,
              articleId,
            },
          }),
        ),
      ]);

      resetState(false);
      router.refresh();
    } catch (submitError) {
      console.error("Failed to update collection articles:", submitError);
      setError(t("addArticlesDialog.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setArticles([]);
      setPage(1);
      setHasMore(false);
      setKeyword("");
      setDraftKeyword("");
      setError(null);
      setSelectedIds([]);
      setExistingIds([]);
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-full p-2"
        onClick={() => resetState(true)}
        aria-label={t("addArticleButton")}
      >
        <Plus className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={resetState}>
        <DialogContent className="flex max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card p-5">
          <DialogHeader className="mb-0 shrink-0 space-y-1">
            <DialogTitle>{t("addArticlesDialog.title")}</DialogTitle>
            {/* <FormDescription>{t("addArticlesDialog.subtitle")}</FormDescription> */}
          </DialogHeader>

          <div className="mt-4 flex shrink-0 items-center gap-3">
            <Input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setKeyword(draftKeyword.trim());
                }
              }}
              placeholder={t("addArticlesDialog.searchPlaceholder")}
              fullWidth
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full truncate"
              onClick={() => setKeyword(draftKeyword.trim())}
              disabled={loading}
            >
              {t("addArticlesDialog.search")}
            </Button>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            {articles.length === 0 && !loading ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-secondary">
                {t("addArticlesDialog.empty")}
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => {
                  const checked = selectedIdSet.has(article.id);
                  const alreadyAdded = existingIdSet.has(article.id);

                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => toggleSelected(article.id)}
                      className={cn(
                        "flex w-full items-start gap-4 rounded-xl border px-3 py-3 text-left transition-colors",
                        checked
                          ? "border-primary bg-primary/8"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
                      )}
                    >
                      <div className="relative mt-0.5 size-18 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {article.cover ? (
                          <ImageWithFallback
                            src={typeof article.cover === "string" ? article.cover : getImageUrl(article.cover, "small")}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-secondary">
                            {t("addArticlesDialog.noCover")}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="line-clamp-1 text-sm font-semibold text-foreground">
                            {article.title}
                          </div>
                          {alreadyAdded ? (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-secondary">
                              {t("addArticlesDialog.inCollection")}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-secondary">
                          {formatShortDate(
                            article.updatedAt || article.createdAt || "",
                            locale,
                          )}
                        </div>
                        {/* {article.summary ? (
                          <div className="mt-2 line-clamp-2 text-sm text-secondary">
                            {article.summary}
                          </div>
                        ) : null} */}
                      </div>

                      <div
                        className={cn(
                          "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border",
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-transparent",
                        )}
                      >
                        <Check className="size-3" />
                      </div>
                    </button>
                  );
                })}

                {hasMore ? (
                  <div className="pt-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => void loadArticles(page + 1, keyword, true)}
                      disabled={loading}
                    >
                      {loading
                        ? t("addArticlesDialog.loading")
                        : t("addArticlesDialog.loadMore")}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

          <DialogFooter className="mt-4 flex flex-row! justify-end gap-4!">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => resetState(false)}
              disabled={submitting}
            >
              {t("dialog.actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              className="rounded-full"
              onClick={() => void handleSubmit()}
              loading={submitting}
              disabled={!hasChanges}
            >
              {t("addArticlesDialog.confirm", {
                count: addIds.length,
                removeCount: removeIds.length,
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
