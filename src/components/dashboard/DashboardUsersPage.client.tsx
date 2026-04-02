"use client";

import { userControllerFindAll } from "@/api";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardUserItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import {
  formatDashboardCount,
  formatDashboardDate,
  getRoleLabels,
} from "./utils";

export function DashboardUsersPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();

  const columns = useMemo<DashboardTableColumn<DashboardUserItem>[]>(
    () => [
      {
        key: "user",
        header: copy.columns.user,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.keywordPlaceholder,
        render: (item) => (
          <Link
            href={`/account/${item.id}`}
            className="flex min-w-0 items-center gap-3"
          >
            <Avatar
              url={item.avatar}
              frameUrl={item.equippedDecorations?.AVATAR_FRAME?.imageUrl}
              className="size-10 shrink-0"
              alt={item.nickname || item.username}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.nickname || item.username}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                @{item.username}
              </div>
            </div>
          </Link>
        ),
      },
      {
        key: "roles",
        header: copy.columns.roles,
        hideInSearch: true,
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            {getRoleLabels(item.roles).length ? (
              getRoleLabels(item.roles).map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      {
        key: "stats",
        header: copy.columns.posts,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.posts}:{" "}
              {formatDashboardCount(item.articleCount || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.followers}:{" "}
              {formatDashboardCount(item.followerCount || 0, locale)}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        hideInSearch: true,
        render: (item) => <DashboardStatusBadge value={item.status} />,
      },
      {
        key: "updatedAt",
        header: copy.columns.updatedAt,
        hideInSearch: true,
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {formatDashboardDate(item.updatedAt)}
          </span>
        ),
      },
    ],
    [copy, locale],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        title={copy.pages.users.title}
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const keywordValue = typeof keyword === "string" ? keyword : "";

          const response = await userControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              keyword: keywordValue || undefined,
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.users}
        className="h-full"
      />
    </DashboardPageFrame>
  );
}
