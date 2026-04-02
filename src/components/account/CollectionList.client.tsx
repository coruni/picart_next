"use client";

import { collectionControllerFindAll, CollectionControllerFindAllResponse } from "@/api";
import { EmptyState, InfiniteScrollStatus } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { Link } from "@/i18n/routing";
import { formatCompactNumber } from "@/lib";
import { ChevronRight, FolderClosed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

type CollectionListItem = NonNullable<
  CollectionControllerFindAllResponse["data"]["data"]
>[number];

export type AccountCollectionItem = CollectionListItem & {
  href?: string;
};

type CollectionListClientProps = {
  initCollections: AccountCollectionItem[];
  initPage: number;
  initTotal: number;
  userId: number;
  emptyMessage?: string;
  pageSize?: number;
};

export function CollectionListClient({
  initCollections,
  initPage,
  initTotal,
  userId,
  emptyMessage,
  pageSize = 10,
}: CollectionListClientProps) {
  const t = useTranslations("accountCollectionList");
  const tAccountInfo = useTranslations("accountInfo");
  const locale = useLocale();
  const observerRef = useRef<HTMLDivElement>(null);
  const [collections, setCollections] =
    useState<AccountCollectionItem[]>(initCollections);
  const [page, setPage] = useState(initPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initCollections.length < initTotal);
  const [error, setError] = useState<string | null>(null);
  const hasBootstrappedRef = useRef(false);
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

  const loadMoreCollections = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await collectionControllerFindAll({
        query: {
          page,
          limit: pageSize,
          userId,
        },
      });

      const newCollections =
        (response.data?.data?.data as AccountCollectionItem[] | undefined) ||
        [];

      if (newCollections.length === 0) {
        setHasMore(false);
      } else {
        setCollections((prev) => [...prev, ...newCollections]);
        setPage((prev) => prev + 1);

        const responseTotal = response.data?.data?.meta?.total || initTotal;
        if (collections.length + newCollections.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more account collections:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [collections.length, hasMore, initTotal, loading, page, pageSize, t, userId]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        void loadMoreCollections();
      }
    },
  });

  useEffect(() => {
    if (hasBootstrappedRef.current || initCollections.length > 0) {
      return;
    }

    hasBootstrappedRef.current = true;

    const bootstrapCollections = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await collectionControllerFindAll({
          query: {
            page: 1,
            limit: pageSize,
            userId,
          },
        });

        const firstPageCollections =
          (response.data?.data?.data as AccountCollectionItem[] | undefined) ||
          [];
        const responseTotal = response.data?.data?.meta?.total || 0;

        setCollections(firstPageCollections);
        setPage(2);
        setHasMore(firstPageCollections.length < responseTotal);
      } catch (loadError) {
        console.error("Failed to bootstrap account collections:", loadError);
        setError(t("loadFailed"));
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    void bootstrapCollections();
  }, [initCollections.length, pageSize, t, userId]);

  if (collections.length === 0) {
    return (
      <div className="rounded-xl bg-card px-4 py-8 md:px-6 md:py-10">
        <EmptyState
          message={emptyMessage ?? t("empty")}
          showButton={false}
          className="pb-0"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-xl bg-card">
      {collections.map((collection, index) => (
        <article
          key={`${collection.id}-${index}`}
          className="border-b border-border last-of-type:border-b-0 cursor-pointer"
        >
          <Link
            href={
              collection.href ||
              `/account/${userId}/collection/${collection.id}`
            }
            className="group flex items-center space-x-4 rounded-xl p-4 hover:bg-primary/15"
          >
            <div className="relative size-16.5 shrink-0 overflow-hidden rounded-lg">
              {collection.cover || collection.avatar ? (
                <ImageWithFallback
                  fill
                  quality={95}
                  src={collection.cover || collection.avatar || ""}
                  alt={collection.name || ""}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded-lg bg-muted text-primary">
                  <FolderClosed size={26} strokeWidth={1.8} />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <FolderClosed size={14} strokeWidth={2} />
                  </div>
                  <span className="truncate font-semibold text-foreground">
                    {collection.name || t("untitled")}
                  </span>
                </div>

                <div className="pt-2 text-xs text-secondary">
                  {formatCompactNumber(collection.itemCount || 0, {
                    locale,
                    labels: compactNumberLabels,
                  })}{" "}
                  {t("posts")} /{" "}
                  {formatCompactNumber(collection.user?.followerCount || 0, {
                    locale,
                    labels: compactNumberLabels,
                  })}{" "}
                  {t("followers")}
                </div>
              </div>

              <ChevronRight size={16} className="text-secondary" />
            </div>
          </Link>
        </article>
      ))}

      <InfiniteScrollStatus
        observerRef={observerRef}
        hasMore={hasMore}
        loading={loading}
        error={error}
        isEmpty={collections.length === 0}
        onRetry={loadMoreCollections}
        loadingText={t("loading")}
        idleText={t("loadMore")}
        retryText={t("retry")}
        allLoadedText={t("allLoaded")}
        emptyText={emptyMessage ?? t("empty")}
        loadingClassName="text-secondary"
        idleTextClassName="text-secondary"
        endClassName="text-muted-foreground"
        emptyClassName="text-muted-foreground"
      />
    </div>
  );
}
