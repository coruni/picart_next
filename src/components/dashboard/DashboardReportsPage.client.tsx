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
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
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

  const typeValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      USER: { text: "USER" },
      ARTICLE: { text: "ARTICLE" },
      COMMENT: { text: "COMMENT" },
    }),
    [copy.common.all],
  );

  const categoryValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      SPAM: { text: "SPAM" },
      ABUSE: { text: "ABUSE" },
      INAPPROPRIATE: { text: "INAPPROPRIATE" },
      COPYRIGHT: { text: "COPYRIGHT" },
      OTHER: { text: "OTHER" },
    }),
    [copy.common.all],
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
      { value: "DELETE_CONTENT", label: "DELETE_CONTENT" },
      { value: "BAN_USER", label: "BAN_USER" },
      { value: "WARNING", label: "WARNING" },
      { value: "NONE", label: "NONE" },
    ],
    [],
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
        key: "reason",
        header: copy.columns.reason,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.reportPlaceholder,
        ellipsis: true,
        ellipsisClassName: "max-w-[360px]",
        getTooltip: (item) =>
          getStringField(item, "reason") || getStringField(item, "description") || undefined,
        render: (item) => (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">
              {compactText(
                getStringField(item, "reason") || getStringField(item, "description"),
                80,
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatDashboardDate(getStringField(item, "createdAt"))}
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: copy.columns.type,
        dataIndex: "type",
        valueType: "select",
        valueEnum: typeValueEnum,
        render: (item) => (
          <div className="text-sm text-foreground">
            {getStringField(item, "type") || "-"}
          </div>
        ),
      },
      {
        key: "category",
        header: copy.columns.categoryLabel,
        dataIndex: "category",
        valueType: "select",
        valueEnum: categoryValueEnum,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {getStringField(item, "category") || "-"}
          </div>
        ),
      },
      {
        key: "target",
        header: copy.columns.userId,
        hideInSearch: true,
        render: (item) => {
          const targetId =
            getStringField(item, "reportedUserId") ||
            getStringField(item, "reportedArticleId") ||
            getStringField(item, "reportedCommentId") ||
            String(
              getNumberField(item, "reportedUserId") ||
                getNumberField(item, "reportedArticleId") ||
                getNumberField(item, "reportedCommentId") ||
                "",
            );

          return (
            <div className="text-sm text-muted-foreground">{targetId || "-"}</div>
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
    [categoryValueEnum, copy, statusValueEnum, typeValueEnum],
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
