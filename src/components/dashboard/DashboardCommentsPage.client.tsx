"use client";

import { commentControllerFindAllComments } from "@/api";
import { Link } from "@/i18n/routing";
import { prepareCommentHtmlForDisplay } from "@/lib";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardCommentItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardCount, formatDashboardDate } from "./utils";

export function DashboardCommentsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();

  const columns = useMemo<DashboardTableColumn<DashboardCommentItem>[]>(
    () => [
      {
        key: "content",
        header: copy.columns.content,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.commentPlaceholder,
        render: (item) => {
          const contentHtml = prepareCommentHtmlForDisplay(
            String(item.content || ""),
          );

          return (
            <div className="min-w-0">
              <div
                className="line-clamp-3 overflow-hidden text-sm text-foreground [&_p]:m-0 [&_span]:align-middle [&_img]:inline-block [&_img]:align-middle"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDashboardDate(item.createdAt)}
              </div>
            </div>
          );
        },
      },
      {
        key: "author",
        header: copy.columns.author,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-foreground">
            {item.author?.nickname || item.author?.username || "-"}
          </div>
        ),
      },
      {
        key: "article",
        header: copy.columns.sourceArticle,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[320px]",
        getTooltip: (item) => item.article?.title || undefined,
        render: (item) => (
          <Link
            href={item.article?.id ? `/article/${item.article.id}` : "/"}
            className="block truncate text-sm text-foreground hover:text-primary"
          >
            {item.article?.title || "-"}
          </Link>
        ),
      },
      {
        key: "metrics",
        header: copy.columns.likes,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.likes}: {formatDashboardCount(item.likes || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.replies}:{" "}
              {formatDashboardCount(item.replyCount || 0, locale)}
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
    ],
    [copy, locale],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        title={copy.pages.comments.title}
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const keywordValue = typeof keyword === "string" ? keyword : "";

          const response = await commentControllerFindAllComments({
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
        emptyText={copy.empty.comments}
        className="h-full"
      />
    </DashboardPageFrame>
  );
}
