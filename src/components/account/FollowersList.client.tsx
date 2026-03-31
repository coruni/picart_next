"use client";

import { userControllerGetFollowers } from "@/api";
import { AccountUserCard } from "@/components/account/AccountUserCard";
import { InfiniteScrollStatus } from "@/components/shared";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { UserList } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

type FollowersListClientProps = {
  initUsers: UserList;
  initPage: number;
  initTotal: number;
  id: string;
  pageSize?: number;
};

export function FollowersListClient({
  initUsers,
  initPage,
  initTotal,
  id,
  pageSize = 10,
}: FollowersListClientProps) {
  const t = useTranslations("userList");
  const observerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(initPage);
  const [users, setUsers] = useState<UserList>(initUsers);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initUsers.length < initTotal);
  const [error, setError] = useState<string | null>(null);

  const loadMoreUsers = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await userControllerGetFollowers({
        path: { id },
        query: {
          page,
          limit: pageSize,
          keyword: "",
        },
      });

      const newUsers = ((response.data?.data?.data as UserList | undefined) || []);

      if (newUsers.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
        setPage((prev) => prev + 1);

        const responseTotal = response.data?.data?.meta?.total || initTotal;
        if (users.length + newUsers.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more followers:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [hasMore, id, initTotal, loading, page, pageSize, t, users.length]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    onIntersect: () => {
      if (!loading) {
        void loadMoreUsers();
      }
    },
  });

  return (
    <div className="space-y-1">
      {users.map((user, index) => (
        <AccountUserCard
          key={user.id}
          user={user}
          border={index < users.length - 1}
        />
      ))}

      <InfiniteScrollStatus
        observerRef={observerRef}
        hasMore={hasMore}
        loading={loading}
        error={error}
        isEmpty={users.length === 0}
        onRetry={loadMoreUsers}
        loadingText={t("loading")}
        idleText={t("loadMore")}
        retryText={t("retry")}
        allLoadedText={t("allLoaded")}
        emptyText={t("noUsers")}
        loadingClassName="text-secondary"
        idleTextClassName="text-secondary"
        endClassName="text-secondary"
        emptyClassName="text-muted-foreground"
      />
    </div>
  );
}
