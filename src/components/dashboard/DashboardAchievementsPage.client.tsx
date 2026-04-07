"use client";

import {
  achievementControllerFindAll,
  achievementControllerRemove,
  achievementControllerUpdate,
  decorationControllerFindAll,
} from "@/api";
import { DropdownMenu } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { DashboardAchievementItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

export function DashboardAchievementsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardAchievementItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DashboardAchievementItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "code", label: copy.columns.code },
      { name: "name", label: copy.columns.name },
      { name: "description", label: copy.columns.description, type: "textarea" },
      {
        name: "icon",
        label: "Icon",
        type: "image",
        imagePreviewClassName: "aspect-square h-auto w-full max-w-52",
        imageObjectFit: "contain",
      },
      {
        name: "type",
        label: copy.columns.type,
        type: "select",
        options: [
          { value: "ARTICLE", label: "ARTICLE" },
          { value: "COMMENT", label: "COMMENT" },
          { value: "SOCIAL", label: "SOCIAL" },
          { value: "LEVEL", label: "LEVEL" },
          { value: "SPECIAL", label: "SPECIAL" },
        ],
      },
      {
        name: "rarity",
        label: copy.columns.rarity,
        type: "select",
        options: [
          { value: "COMMON", label: "COMMON" },
          { value: "RARE", label: "RARE" },
          { value: "EPIC", label: "EPIC" },
          { value: "LEGENDARY", label: "LEGENDARY" },
        ],
      },
      { name: "rewardPoints", label: "Reward Points", type: "number", step: 1 },
      { name: "rewardExp", label: "Reward Exp", type: "number", step: 1 },
      {
        name: "rewardDecorationId",
        label: "Reward Decoration ID",
        type: "select",
        searchable: true,
        searchPlaceholder: copy.filters.decorationPlaceholder,
        options:
          editingItem?.rewardDecorationId == null
            ? [{ value: "", label: "-" }]
            : [
                {
                  value: String(editingItem.rewardDecorationId),
                  label: String(editingItem.rewardDecorationId),
                },
              ],
        loadOptions: async (keyword) => {
          const response = await decorationControllerFindAll({
            query: {
              page: 1,
              limit: 100,
              keyword: keyword || undefined,
            },
          });

          const rows = response?.data?.data?.data || [];

          return [
            { value: "", label: "-" },
            ...rows
              .filter((item) => item.id != null)
              .map((item) => ({
                value: String(item.id),
                label: item.name || String(item.id),
              })),
          ];
        },
      },
      { name: "hidden", label: "Hidden", type: "switch" },
      { name: "sort", label: copy.columns.sort, type: "number", step: 1 },
      { name: "enabled", label: copy.columns.enabled, type: "switch" },
    ],
    [copy, editingItem?.rewardDecorationId],
  );

  const columns = useMemo<DashboardTableColumn<DashboardAchievementItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.achievementPlaceholder,
        render: (item) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/70">
              {item.icon ? (
                <ImageWithFallback
                  src={item.icon}
                  alt={item.name || "achievement"}
                  fill
                  className="object-contain p-2"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.name || "-"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {item.code || "-"}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: copy.columns.type,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>{item.type || "-"}</div>
            <div className="text-muted-foreground">{item.rarity || "-"}</div>
          </div>
        ),
      },
      {
        key: "reward",
        header: copy.columns.count,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>Points: {item.rewardPoints ?? 0}</div>
            <div className="text-muted-foreground">Exp: {item.rewardExp ?? 0}</div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1">
            <DashboardStatusBadge value={item.enabled ? "active" : "inactive"} />
            <div className="text-xs text-muted-foreground">
              {formatDashboardDate(item.updatedAt)}
            </div>
          </div>
        ),
      },
      {
        key: "action",
        header: copy.columns.action,
        hideInSearch: true,
        render: (item) =>
          item.id ? (
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
          ),
      },
    ],
    [copy],
  );

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setDeleteLoading(true);
    try {
      await achievementControllerRemove({
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
        title={copy.pages.achievements.title}
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const response = await achievementControllerFindAll({
            query: {
              keyword: typeof keyword === "string" && keyword ? keyword : undefined,
              sortBy: "sort",
              sortOrder: "DESC",
            },
          });

          const rows = response?.data?.data || [];
          const start = (current - 1) * pageSize;

          return {
            data: rows.slice(start, start + pageSize),
            total: rows.length,
            totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
          };
        }}
        getRowKey={(item) =>
          item.id || item.code || `${item.name || "achievement"}-${item.type || "default"}`
        }
        emptyText={copy.empty.achievements}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.achievements.title}`}
        fields={editFields}
        initialValues={{
          code: editingItem?.code,
          name: editingItem?.name,
          description: editingItem?.description,
          icon: editingItem?.icon,
          type: editingItem?.type,
          rarity: editingItem?.rarity,
          rewardPoints: editingItem?.rewardPoints,
          rewardExp: editingItem?.rewardExp,
          rewardDecorationId:
            editingItem?.rewardDecorationId == null
              ? ""
              : String(editingItem.rewardDecorationId),
          hidden: editingItem?.hidden,
          sort: editingItem?.sort,
          enabled: editingItem?.enabled,
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
            await achievementControllerUpdate({
              path: { id: String(editingItem.id) },
              body: {
                code: values.code as string | undefined,
                name: values.name as string | undefined,
                description: values.description as string | undefined,
                icon: values.icon as string | undefined,
                type: values.type as
                  | "ARTICLE"
                  | "COMMENT"
                  | "SOCIAL"
                  | "LEVEL"
                  | "SPECIAL"
                  | undefined,
                rarity: values.rarity as
                  | "COMMON"
                  | "RARE"
                  | "EPIC"
                  | "LEGENDARY"
                  | undefined,
                rewardPoints: values.rewardPoints as number | undefined,
                rewardExp: values.rewardExp as number | undefined,
                rewardDecorationId:
                  typeof values.rewardDecorationId === "string" &&
                  values.rewardDecorationId
                    ? Number(values.rewardDecorationId)
                    : undefined,
                hidden: values.hidden as boolean | undefined,
                sort: values.sort as number | undefined,
                enabled: values.enabled as boolean | undefined,
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
