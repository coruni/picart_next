"use client";

import {
  bannerControllerFindAll,
  bannerControllerRemove,
  bannerControllerUpdate,
} from "@/api";
import { DropdownMenu } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import {
  DashboardEditDialog,
  type DashboardEditField,
} from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { DashboardBannerItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

export function DashboardBannersPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardBannerItem | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<DashboardBannerItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const statusValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      active: { text: copy.status.active },
      inactive: { text: copy.status.inactive },
    }),
    [copy],
  );

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "title", label: copy.columns.title },
      {
        name: "description",
        label: copy.columns.description,
        type: "textarea",
      },
      {
        name: "imageUrl",
        label: "Image",
        type: "image",
        imagePreviewClassName: "aspect-video h-auto w-full max-w-52",
        imageObjectFit: "cover",
      },
      { name: "linkUrl", label: copy.columns.link },
      {
        name: "sortOrder",
        label: copy.columns.sort,
        type: "number",
        step: 1,
      },
      {
        name: "status",
        label: copy.columns.status,
        type: "select",
        options: [
          { value: "active", label: copy.status.active },
          { value: "inactive", label: copy.status.inactive },
        ],
      },
    ],
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardBannerItem>[]>(
    () => [
      {
        key: "title",
        header: copy.columns.title,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.bannerTitlePlaceholder,
        render: (item) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/70">
              {item.imageUrl ? (
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={item.title || "banner"}
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.title || "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDashboardDate(item.updatedAt)}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "link",
        header: copy.columns.link,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[360px]",
        getTooltip: (item) => item.linkUrl || undefined,
        render: (item) => (
          <div className="truncate text-sm text-muted-foreground">
            {item.linkUrl || "-"}
          </div>
        ),
      },
      {
        key: "sort",
        header: copy.columns.sort,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {item.sortOrder ?? 0}
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
        render: (item) =>
          (() => {
            const bannerId = item.id;

            return typeof bannerId === "number" ? (
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
          })(),
      },
    ],
    [copy, statusValueEnum],
  );

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setDeleteLoading(true);
    try {
      await bannerControllerRemove({
        path: { id: deletingItem.id },
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
        title={copy.pages.banners.title}
        columns={columns}
        request={async ({ current, pageSize, keyword, status }) => {
          const response = await bannerControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              status: typeof status === "string" && status ? status : undefined,
              sortBy: "sortOrder",
              sortOrder: "DESC",
            },
          });

          const rows = response?.data?.data?.data || [];
          const normalizedKeyword =
            typeof keyword === "string" ? keyword.trim().toLowerCase() : "";
          const filteredRows = rows.filter((item) => {
            if (!normalizedKeyword) {
              return true;
            }

            return (
              String(item.title || "")
                .toLowerCase()
                .includes(normalizedKeyword) ||
              String(item.description || "")
                .toLowerCase()
                .includes(normalizedKeyword)
            );
          });

          return {
            data: filteredRows,
            total: response?.data?.data?.meta?.total || filteredRows.length,
            totalPages: Number(response?.data?.data?.meta?.totalPages || 1),
          };
        }}
        getRowKey={(item) =>
          item.id ||
          `${item.title || "banner"}-${item.linkUrl || item.imageUrl || ""}`
        }
        emptyText={copy.empty.banners}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.banners.title}`}
        fields={editFields}
        initialValues={{
          title: editingItem?.title,
          description: editingItem?.description,
          imageUrl: editingItem?.imageUrl,
          linkUrl: editingItem?.linkUrl,
          sortOrder: editingItem?.sortOrder,
          status: editingItem?.status,
        }}
        loading={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editingItem?.id) {
            return;
          }

          setSubmitting(true);

          try {
            await bannerControllerUpdate({
              path: { id: editingItem.id },
              body: {
                title: values.title,
                description: values.description,
                imageUrl: values.imageUrl,
                linkUrl: values.linkUrl,
                sortOrder: values.sortOrder,
                status: values.status,
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
