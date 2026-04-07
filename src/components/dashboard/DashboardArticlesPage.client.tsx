"use client";

import {
  articleControllerFindAll,
  articleControllerRemove,
  articleControllerUpdate,
} from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { Link, useRouter } from "@/i18n/routing";
import {
  CheckCircle,
  FileCheck,
  MoreHorizontal,
  PencilLine,
  Trash2,
  XCircle,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { DashboardArticleItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardCount, formatDashboardDate } from "./utils";

export function DashboardArticlesPage() {
  const router = useRouter();
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [refreshKey, setRefreshKey] = useState(0);
  const [auditingItem, setAuditingItem] = useState<DashboardArticleItem | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<DashboardArticleItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [auditReason, setAuditReason] = useState("");
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  const statusValueEnum = useMemo(
    () => ({
      DRAFT: { text: copy.status.DRAFT },
      PUBLISHED: { text: copy.status.PUBLISHED },
      PENDING: { text: copy.status.PENDING },
      UNDER_REVIEW: { text: copy.status.UNDER_REVIEW },
      APPROVED: { text: copy.status.APPROVED },
      REJECTED: { text: copy.status.REJECTED },
    }),
    [copy],
  );

  const handleAudit = async (status: "APPROVED" | "REJECTED") => {
    if (!auditingItem?.id) return;

    setAuditSubmitting(true);
    try {
      await articleControllerUpdate({
        path: { id: String(auditingItem.id) },
        body: {
          status: status === "APPROVED" ? "PUBLISHED" : "DRAFT",
        },
      });
      setAuditingItem(null);
      setAuditReason("");
      setRefreshKey((current) => current + 1);
    } finally {
      setAuditSubmitting(false);
    }
  };

  const columns = useMemo<DashboardTableColumn<DashboardArticleItem>[]>(
    () => [
      {
        key: "title",
        header: copy.columns.article,
        dataIndex: "title",
        searchPlaceholder: copy.filters.articleTitlePlaceholder,
        ellipsis: true,
        getTooltip: (item) => item.title,
        render: (item) => (
          <div className="min-w-0">
            <Link
              href={`/article/${item.id}`}
              className="block truncate text-sm font-medium text-foreground hover:text-primary"
            >
              {item.title}
            </Link>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatDashboardDate(item.updatedAt)}
            </div>
          </div>
        ),
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
        key: "category",
        header: copy.columns.category,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {item.category?.name || "-"}
          </div>
        ),
      },
      {
        key: "metrics",
        header: copy.columns.views,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.views}:{" "}
              {formatDashboardCount(item.views || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.comments}:{" "}
              {formatDashboardCount(item.commentCount || 0, locale)}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        dataIndex: "status",
        valueType: "select",
        valueEnum: statusValueEnum,
        render: (item) => <DashboardStatusBadge value={item.status} />,
      },
      {
        key: "action",
        header: copy.columns.action,
        hideInSearch: true,
        render: (item) => {
          const menuItems: MenuItem[] = [
            {
              label: copy.common.edit,
              icon: <PencilLine size={16} />,
              onClick: () => {
                router.push(
                  item.type === "image"
                    ? `/create/image?articleId=${item.id}`
                    : `/create/post?articleId=${item.id}`,
                );
              },
            },
            {
              label: copy.common.audit,
              icon: <FileCheck size={16} />,
              onClick: () => {
                setAuditingItem(item);
                setAuditReason("");
              },
            },
            {
              label: copy.common.delete,
              icon: <Trash2 size={16} />,
              className: "text-red-500",
              onClick: () => setDeletingItem(item),
            },
          ];

          return (
            <DropdownMenu
              title={copy.columns.action}
              items={menuItems}
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
          );
        },
      },
    ],
    [copy, locale, router, statusValueEnum],
  );

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setDeleteLoading(true);
    try {
      await articleControllerRemove({
        path: { id: String(deletingItem.id) },
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
        title={copy.pages.articles.title}
        columns={columns}
        request={async ({ current, pageSize, ...rest }) => {
          const response = await articleControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              ...rest,
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.articles}
        className="h-full"
      />

      {/* Audit Dialog */}
      <Dialog
        open={Boolean(auditingItem)}
        onOpenChange={(open) =>
          !auditSubmitting && !open && setAuditingItem(null)
        }
      >
        <DialogContent className="max-w-lg p-0!">
          <DialogHeader className="px-6 py-4 mb-0! border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="size-4 text-primary" />
              {copy.common.audit}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 px-4">
            {auditingItem && (
              <div className="mb-4 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
                <div className="text-sm font-medium text-foreground">
                  {auditingItem.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {copy.columns.author}:{" "}
                  {auditingItem.author?.nickname ||
                    auditingItem.author?.username ||
                    "-"}
                </div>
              </div>
            )}
            <div className="space-y-2 ">
              <label className="text-sm font-medium text-foreground">
                {copy.common.auditReason}
              </label>
              <Textarea
                fullWidth
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder={copy.common.auditReasonPlaceholder}
                className="min-h-25"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pb-4 px-6">
            <Button
              variant="outline"
              className="h-9 rounded-full px-4"
              onClick={() => setAuditingItem(null)}
              disabled={auditSubmitting}
            >
              <XCircle className="mr-2 size-4" />
              {copy.common.reject}
            </Button>
            <Button
              variant="primary"
              className="h-9 rounded-full px-4"
              loading={auditSubmitting}
              onClick={() => handleAudit("APPROVED")}
            >
              <CheckCircle className="mr-2 size-4" />
              {copy.common.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
