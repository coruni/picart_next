"use client";

import {
  reportControllerFindAll,
  reportControllerRemove,
  reportControllerUpdate,
} from "@/api";
import { DropdownMenu } from "@/components/shared";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { DashboardReportItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import {
  compactText,
  formatDashboardDate,
  getNumberField,
  getStringField,
  normalizeUnknownListResponse,
} from "./utils";

export function DashboardReportsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardReportItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DashboardReportItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const _typeValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      USER: { text: copy.options.reportType.USER },
      ARTICLE: { text: copy.options.reportType.ARTICLE },
      COMMENT: { text: copy.options.reportType.COMMENT },
    }),
    [copy.common.all, copy.options.reportType],
  );

  const categoryValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      SPAM: { text: copy.options.reportCategory.SPAM },
      ABUSE: { text: copy.options.reportCategory.ABUSE },
      INAPPROPRIATE: { text: copy.options.reportCategory.INAPPROPRIATE },
      COPYRIGHT: { text: copy.options.reportCategory.COPYRIGHT },
      OTHER: { text: copy.options.reportCategory.OTHER },
    }),
    [copy.common.all, copy.options.reportCategory],
  );

  const statusValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      PENDING: { text: copy.status.PENDING },
      PROCESSING: { text: copy.status.PROCESSING },
      RESOLVED: { text: copy.status.RESOLVED },
      REJECTED: { text: copy.status.REJECTED },
    }),
    [copy],
  );

  const reportActionOptions = useMemo(
    () => [
      { value: "DELETE_CONTENT", label: copy.options.reportAction.DELETE_CONTENT },
      { value: "BAN_USER", label: copy.options.reportAction.BAN_USER },
      { value: "WARNING", label: copy.options.reportAction.WARNING },
      { value: "NONE", label: copy.options.reportAction.NONE },
    ],
    [copy.options.reportAction],
  );

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      {
        name: "status",
        label: copy.columns.status,
        type: "select",
        options: Object.entries(statusValueEnum)
          .filter(([value]) => value)
          .map(([value, item]) => ({ value, label: item.text })),
      },
      {
        name: "action",
        label: copy.columns.action,
        type: "select",
        options: reportActionOptions,
      },
      { name: "result", label: copy.columns.description, type: "textarea" },
    ],
    [copy, reportActionOptions, statusValueEnum],
  );

  const columns = useMemo<DashboardTableColumn<DashboardReportItem>[]>(
    () => [
      {
        key: "reporter",
        header: "举报人",
        hideInSearch: true,
        render: (item) => {
          const reporter = item.reporter as Record<string, unknown> | undefined;
          if (!reporter) return <span className="text-sm text-muted-foreground">-</span>;

          const username = getStringField(reporter, "username");
          const avatar = getStringField(reporter, "avatar");
          const articleCount = getNumberField(reporter, "articleCount") || 0;

          return (
            <div className="flex items-center gap-2">
              <Avatar
                url={avatar || "/images/default-avatar.png"}
                alt={username}
                className="size-8"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{username}</span>
                <span className="text-xs text-muted-foreground">发文 {articleCount}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "targetUser",
        header: "被举报者",
        hideInSearch: true,
        render: (item) => {
          const reportedUser = item.reportedUser as Record<string, unknown> | undefined;
          if (!reportedUser) return <span className="text-sm text-muted-foreground">-</span>;

          const username = getStringField(reportedUser, "username");
          const avatar = getStringField(reportedUser, "avatar");
          const articleCount = getNumberField(reportedUser, "articleCount") || 0;
          const followerCount = getNumberField(reportedUser, "followerCount") || 0;

          return (
            <div className="flex items-center gap-2">
              <Avatar
                url={avatar || "/images/default-avatar.png"}
                alt={username}
                className="size-8"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{username}</span>
                <span className="text-xs text-muted-foreground">
                  粉丝 {followerCount} · 文章 {articleCount}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "content",
        header: "举报内容",
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.reportPlaceholder,
        ellipsis: true,
        getTooltip: (item) =>
          getStringField(item, "reason") || getStringField(item, "description") || undefined,
        render: (item) => {
          const type = getStringField(item, "type");
          const reason = getStringField(item, "reason");
          const description = getStringField(item, "description");

          // 获取被举报内容的预览
          let contentPreview = "";
          const reportedArticle = item.reportedArticle as Record<string, unknown> | undefined;
          const reportedComment = item.reportedComment as Record<string, unknown> | undefined;

          if (type === "ARTICLE" && reportedArticle) {
            contentPreview = getStringField(reportedArticle, "title") ||
              getStringField(reportedArticle, "content")?.slice(0, 50) || "";
          } else if (type === "COMMENT" && reportedComment) {
            contentPreview = getStringField(reportedComment, "content")?.slice(0, 50) || "";
          }

          return (
            <div className="min-w-0 max-w-[280px]">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-xs font-medium",
                  type === "USER" && "bg-blue-100 text-blue-700",
                  type === "ARTICLE" && "bg-green-100 text-green-700",
                  type === "COMMENT" && "bg-purple-100 text-purple-700",
                )}>
                  {type}
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {compactText(reason, 40)}
                </span>
              </div>
              {contentPreview && (
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  内容: {contentPreview}
                </div>
              )}
              {description && (
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  补充: {compactText(String(description), 40)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "category",
        header: copy.columns.categoryLabel,
        dataIndex: "category",
        valueType: "select",
        valueEnum: categoryValueEnum,
        render: (item) => {
          const category = getStringField(item, "category");
          const categoryColors: Record<string, string> = {
            SPAM: "bg-orange-100 text-orange-700",
            ABUSE: "bg-red-100 text-red-700",
            INAPPROPRIATE: "bg-yellow-100 text-yellow-700",
            COPYRIGHT: "bg-indigo-100 text-indigo-700",
            OTHER: "bg-gray-100 text-gray-700",
          };
          return (
            <span className={cn(
              "rounded px-2 py-0.5 text-xs font-medium",
              categoryColors[category || ""] || "bg-gray-100 text-gray-700"
            )}>
              {category || "-"}
            </span>
          );
        },
      },
      {
        key: "status",
        header: copy.columns.status,
        dataIndex: "status",
        valueType: "select",
        valueEnum: statusValueEnum,
        render: (item) => (
          <DashboardStatusBadge value={getStringField(item, "status")} />
        ),
      },
      {
        key: "createdAt",
        header: "举报时间",
        hideInSearch: true,
        render: (item) => (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>{formatDashboardDate(getStringField(item, "createdAt"))}</span>
          </div>
        ),
      },
      {
        key: "action",
        header: copy.columns.action,
        hideInSearch: true,
        render: (item) => {
          const reportId =
            getNumberField(item, "id") || Number(getStringField(item, "id"));

          return Number.isFinite(reportId) && reportId > 0 ? (
            <DropdownMenu
              title={copy.columns.action}
              items={[
                {
                  label: copy.common.edit,
                  icon: <PencilLine size={16} />,
                  onClick: () => setEditingItem(item),
                },
                {
                  label: copy.common.delete,
                  icon: <Trash2 size={16} />,
                  className: "text-red-500",
                  onClick: () => setDeletingItem(item),
                },
              ]}
              trigger={
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MoreHorizontal size={16} />
                </button>
              }
              className="inline-flex"
              menuClassName="top-8"
            />
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          );
        },
      },
    ],
    [categoryValueEnum, copy, statusValueEnum],
  );

  const handleDelete = async () => {
    if (!deletingItem) return;

    const reportId =
      getNumberField(deletingItem, "id") || Number(getStringField(deletingItem, "id"));

    if (!Number.isFinite(reportId) || reportId <= 0) return;

    setDeleteLoading(true);
    try {
      await reportControllerRemove({
        path: { id: String(reportId) },
      });
      setDeletingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.reports.title}
        columns={columns}
        request={async ({ current, pageSize, keyword, status, type, category }) => {
          const response = await reportControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              keyword: typeof keyword === "string" && keyword ? keyword : undefined,
              status:
                typeof status === "string" && status
                  ? (status as "PENDING" | "PROCESSING" | "RESOLVED" | "REJECTED")
                  : undefined,
              type:
                typeof type === "string" && type
                  ? (type as "USER" | "ARTICLE" | "COMMENT")
                  : undefined,
              category:
                typeof category === "string" && category
                  ? (
                      category as
                        | "SPAM"
                        | "ABUSE"
                        | "INAPPROPRIATE"
                        | "COPYRIGHT"
                        | "OTHER"
                    )
                  : undefined,
              sortBy: "createdAt",
              sortOrder: "DESC",
            },
          });

          return normalizeUnknownListResponse(response?.data);
        }}
        getRowKey={(item) =>
          getStringField(item, "id") ||
          `${getStringField(item, "createdAt")}-${getStringField(item, "reason")}`
        }
        emptyText={copy.empty.reports}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.reports.title}`}
        fields={editFields}
        initialValues={{
          status: editingItem ? getStringField(editingItem, "status") : "",
          action: editingItem ? getStringField(editingItem, "action") : "",
          result: editingItem ? getStringField(editingItem, "result") : "",
        }}
        loading={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editingItem) {
            return;
          }

          const reportId =
            getNumberField(editingItem, "id") || Number(getStringField(editingItem, "id"));

          if (!Number.isFinite(reportId) || reportId <= 0) {
            return;
          }

          setSubmitting(true);

          try {
            await reportControllerUpdate({
              path: { id: String(reportId) },
              body: {
                status: values.status as
                  | "PENDING"
                  | "PROCESSING"
                  | "RESOLVED"
                  | "REJECTED"
                  | undefined,
                action: values.action as
                  | "DELETE_CONTENT"
                  | "BAN_USER"
                  | "WARNING"
                  | "NONE"
                  | undefined,
                result: values.result as string | undefined,
              },
            });
            setEditingItem(null);
            setRefreshKey((current) => current + 1);
          } finally {
            setSubmitting(false);
          }
        }}
      />
      <DeleteConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        title={copy.common.delete}
        description={copy.common.deleteConfirm}
        onConfirm={handleDelete}
        loading={deleteLoading}
        confirmText={copy.common.delete}
        cancelText={copy.common.cancel}
      />
    </DashboardPageFrame>
  );
}
