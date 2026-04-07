"use client";

import { decorationControllerFindAllActivities } from "@/api/sdk.gen";
import type { DecorationControllerFindAllActivitiesResponse } from "@/api/types.gen";
import { EmptyState, InfiniteScrollStatus } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { ActivityCard } from "./ActivityCard";

type ActivityItem =
  DecorationControllerFindAllActivitiesResponse["data"]["data"][0];

type ActivityListProps = {
  initActivities: ActivityItem[];
  initPage: number;
  initTotal: number;
};

export const ActivityList = (props: ActivityListProps) => {
  const t = useTranslations("activity");
  const tc = useTranslations("common");
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { initActivities, initPage, initTotal } = props;

  const [page, setPage] = useState(initPage);
  const [activities, setActivities] = useState<ActivityItem[]>(initActivities);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initActivities.length < initTotal);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await decorationControllerFindAllActivities({
        query: {
          page: page,
          limit: pageSize,
        },
      });

      if (response.data?.data?.data) {
        const newActivities = response.data.data.data;
        const meta = response.data.data.meta;

        if (newActivities.length === 0) {
          setHasMore(false);
        } else {
          setActivities((prev) => [...prev, ...newActivities]);
          setPage((p) => p + 1);

          const totalLoaded = activities.length + newActivities.length;
          if (totalLoaded >= meta.total) {
            setHasMore(false);
          }
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load activities:", err);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, activities.length, t]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        loadMore();
      }
    },
  });

  if (!isAuthenticated) {
    return (
      <EmptyState
        message={t("loginPrompt")}
        customButton={
          <Button onClick={openLoginDialog} className="rounded-full">
            {tc("login")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity list */}
      <div className="grid grid-cols-1 gap-4 px-4">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>

      <InfiniteScrollStatus
        observerRef={observerRef}
        hasMore={hasMore}
        loading={loading}
        error={error}
        isEmpty={activities.length === 0}
        onRetry={loadMore}
        loadingText={t("loading")}
        idleText={t("loadMore")}
        retryText={tc("retry")}
        allLoadedText={t("allLoaded")}
        emptyText={t("noActivities")}
        loadingClassName="text-secondary"
        idleTextClassName="text-secondary"
        endClassName="text-secondary"
        emptyClassName="text-muted-foreground"
      />
    </div>
  );
};
