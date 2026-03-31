"use client";

import { userControllerFindAll } from "@/api";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { usePathname } from "@/i18n/routing";
import { UserList } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { InfiniteScrollStatus } from "../shared";
import { SearchUser } from "./SearchUser";

type SearchUserListClientProps = {
  initUsers: UserList;
  initPage: number;
  initTotal: number;
  keyword: string;
  pageSize?: number;
  cacheKey?: string;
};

export function SearchUserListClient({
  initUsers,
  initPage,
  initTotal,
  keyword,
  pageSize = 10,
  cacheKey,
}: SearchUserListClientProps) {
  const t = useTranslations("userList");
  const pathname = usePathname();
  const normalizedKeyword = keyword.trim();
  const storageKey = cacheKey || `search-user-list-${pathname}-${normalizedKeyword}`;
  const scrollKey = `${storageKey}-scroll`;

  const getInitialState = () => {
    if (typeof window === "undefined") {
      return { users: initUsers, page: initPage };
    }

    const navigationType = (
      performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    )?.type;

    if (navigationType === "reload") {
      try {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(scrollKey);
      } catch (error) {
        console.error("Failed to clear search cache on refresh:", error);
      }

      return { users: initUsers, page: initPage };
    }

    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        const { users, page, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return { users, page };
        }
      }
    } catch (error) {
      console.error("Failed to restore search cache:", error);
    }

    return { users: initUsers, page: initPage };
  };

  const initialState = getInitialState();
  const isPageRefresh = useRef(
    typeof window !== "undefined" &&
      (
        performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      )?.type === "reload",
  );
  const observerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(initialState.page);
  const [users, setUsers] = useState<UserList>(initialState.users);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialState.users.length < initTotal);
  const [error, setError] = useState<string | null>(null);
  const [scrollRestored, setScrollRestored] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    setUsers(initUsers);
    setPage(initPage);
    setHasMore(initUsers.length < initTotal);
    setError(null);
    setScrollRestored(false);
  }, [initPage, initTotal, initUsers, normalizedKeyword]);

  const fetchPage = useCallback(
    async (pageToLoad: number) => {
      if (!normalizedKeyword) {
        return {
          users: [] as UserList,
          total: 0,
        };
      }

      const response = await userControllerFindAll({
        query: {
          username: normalizedKeyword,
          page: pageToLoad,
          limit: pageSize,
        },
      });

      return {
        users: response.data?.data?.data || [],
        total: response.data?.data?.meta?.total || 0,
      };
    },
    [normalizedKeyword, pageSize],
  );

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    const refetchFirstPage = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchPage(1);
        setUsers(result.users);
        setPage(2);
        setHasMore(result.users.length < result.total);
        setScrollRestored(false);
      } catch (loadError) {
        console.error("Failed to refresh search users:", loadError);
        setError(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    void refetchFirstPage();
  }, [fetchPage, t]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          users,
          page,
          timestamp: Date.now(),
        }),
      );
    } catch (cacheError) {
      console.error("Failed to cache search state:", cacheError);
    }
  }, [page, storageKey, users]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      try {
        sessionStorage.setItem(scrollKey, window.scrollY.toString());
      } catch (scrollError) {
        console.error("Failed to save search scroll position:", scrollError);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollKey]);

  useEffect(() => {
    if (typeof window === "undefined" || scrollRestored || isPageRefresh.current) {
      return;
    }

    try {
      const savedScroll = sessionStorage.getItem(scrollKey);
      if (savedScroll) {
        requestAnimationFrame(() => {
          window.scrollTo(0, Number(savedScroll));
          setScrollRestored(true);
        });
      } else {
        setScrollRestored(true);
      }
    } catch (restoreError) {
      console.error("Failed to restore search scroll position:", restoreError);
      setScrollRestored(true);
    }
  }, [scrollKey, scrollRestored]);

  const loadMoreUsers = useCallback(async () => {
    if (loading || !hasMore || !normalizedKeyword) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPage(page);
      const newUsers = result.users;
      const responseTotal = result.total || initTotal;

      if (newUsers.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
        setPage((prev: number) => prev + 1);
        if (users.length + newUsers.length >= responseTotal) {
          setHasMore(false);
        }
      }
    } catch (loadError) {
      console.error("Failed to load more search users:", loadError);
      setError(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, hasMore, initTotal, loading, normalizedKeyword, page, t, users.length]);

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
        <SearchUser
          key={user.id}
          user={user}
          border={index < users.length - 1}
          keyword={normalizedKeyword}
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
