"use client";

import {
  achievementControllerCreate,
  achievementControllerFindAll,
  achievementControllerRemove,
  achievementControllerUpdate,
  decorationControllerFindAll,
} from "@/api";
import { DropdownMenu } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { MoreHorizontal, PencilLine, Plus, Trash2 } from "lucide-react";
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
import type { DashboardAchievementItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

const ACHIEVEMENT_CODE_OPTIONS = [
  { value: "FIRST_ARTICLE", label: "FIRST_ARTICLE" },
  { value: "ARTICLE_10", label: "ARTICLE_10" },
  { value: "ARTICLE_50", label: "ARTICLE_50" },
  { value: "ARTICLE_100", label: "ARTICLE_100" },
  { value: "FIRST_LIKE", label: "FIRST_LIKE" },
  { value: "LIKE_100", label: "LIKE_100" },
  { value: "LIKE_1000", label: "LIKE_1000" },
  { value: "FIRST_COMMENT", label: "FIRST_COMMENT" },
  { value: "COMMENT_100", label: "COMMENT_100" },
  { value: "FIRST_FOLLOW", label: "FIRST_FOLLOW" },
  { value: "FOLLOW_10", label: "FOLLOW_10" },
  { value: "FIRST_FOLLOWER", label: "FIRST_FOLLOWER" },
  { value: "FOLLOWER_100", label: "FOLLOWER_100" },
  { value: "FOLLOWER_1000", label: "FOLLOWER_1000" },
  { value: "LOGIN_7_DAYS", label: "LOGIN_7_DAYS" },
  { value: "LOGIN_30_DAYS", label: "LOGIN_30_DAYS" },
  { value: "LEVEL_10", label: "LEVEL_10" },
  { value: "LEVEL_30", label: "LEVEL_30" },
  { value: "LEVEL_50", label: "LEVEL_50" },
  { value: "BECOME_MEMBER", label: "BECOME_MEMBER" },
  { value: "PROFILE_COMPLETED", label: "PROFILE_COMPLETED" },
] as const;

export function DashboardAchievementsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] =
    useState<DashboardAchievementItem | null>(null);
  const [deletingItem, setDeletingItem] =
    useState<DashboardAchievementItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const achievementCopy = copy.pages.achievements;
  const achievementCodeOptions = useMemo(
    () =>
      editingItem?.code &&
      !ACHIEVEMENT_CODE_OPTIONS.some(
        (option) => option.value === editingItem.code,
      )
        ? [{ value: editingItem.code, label: editingItem.code }, ...ACHIEVEMENT_CODE_OPTIONS]
        : [...ACHIEVEMENT_CODE_OPTIONS],
    [editingItem?.code],
  );

  const stringifyAchievementCondition = (condition: unknown) => {
    if (!condition || typeof condition !== "object") {
      return JSON.stringify(
        { type: "count", event: "article_publish", target: 1 },
        null,
        2,
      );
    }

    try {
      return JSON.stringify(condition, null, 2);
    } catch {
      return JSON.stringify(
        { type: "count", event: "article_publish", target: 1 },
        null,
        2,
      );
    }
  };

  const parseAchievementCondition = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.error("Invalid achievement condition JSON:", error);
      return {};
    }
  };

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      {
        name: "code",
        label: copy.columns.code,
        type: "select",
        options: achievementCodeOptions as unknown as Array<{
          value: string;
          label: string;
        }>,
      },
      { name: "name", label: copy.columns.name },
      {
        name: "description",
        label: copy.columns.description,
        type: "textarea",
      },
      {
        name: "icon",
        label: achievementCopy.fields.icon,
        type: "image",
        imagePreviewClassName: "aspect-square h-auto w-full max-w-52",
        imageObjectFit: "contain",
      },
      {
        name: "type",
        label: copy.columns.type,
        type: "select",
        options: [
          { value: "ARTICLE", label: achievementCopy.typeOptions.ARTICLE },
          { value: "COMMENT", label: achievementCopy.typeOptions.COMMENT },
          { value: "SOCIAL", label: achievementCopy.typeOptions.SOCIAL },
          { value: "LEVEL", label: achievementCopy.typeOptions.LEVEL },
          { value: "SPECIAL", label: achievementCopy.typeOptions.SPECIAL },
        ],
      },
      {
        name: "rarity",
        label: copy.columns.rarity,
        type: "select",
        options: [
          { value: "COMMON", label: achievementCopy.rarityOptions.COMMON },
          { value: "RARE", label: achievementCopy.rarityOptions.RARE },
          { value: "EPIC", label: achievementCopy.rarityOptions.EPIC },
          {
            value: "LEGENDARY",
            label: achievementCopy.rarityOptions.LEGENDARY,
          },
        ],
      },
      {
        name: "condition",
        label: achievementCopy.fields.condition,
        type: "textarea",
        placeholder: achievementCopy.fields.conditionPlaceholder,
      },
      {
        name: "rewardPoints",
        label: achievementCopy.fields.rewardPoints,
        type: "number",
        step: 1,
      },
      {
        name: "rewardExp",
        label: achievementCopy.fields.rewardExp,
        type: "number",
        step: 1,
      },
      {
        name: "rewardDecorationId",
        label: achievementCopy.fields.rewardDecorationId,
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
      { name: "hidden", label: achievementCopy.fields.hidden, type: "switch" },
      { name: "sort", label: copy.columns.sort, type: "number", step: 1 },
      { name: "enabled", label: copy.columns.enabled, type: "switch" },
    ],
    [achievementCodeOptions, achievementCopy, copy, editingItem?.rewardDecorationId],
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
            <div>
              {item.type
                ? achievementCopy.typeOptions[
                    item.type as keyof typeof achievementCopy.typeOptions
                  ] || item.type
                : "-"}
            </div>
            <div className="text-muted-foreground">
              {item.rarity
                ? achievementCopy.rarityOptions[
                    item.rarity as keyof typeof achievementCopy.rarityOptions
                  ] || item.rarity
                : "-"}
            </div>
          </div>
        ),
      },
      {
        key: "reward",
        header: copy.columns.count,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {achievementCopy.fields.pointsLabel}: {item.rewardPoints ?? 0}
            </div>
            <div className="text-muted-foreground">
              {achievementCopy.fields.expLabel}: {item.rewardExp ?? 0}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1">
            <DashboardStatusBadge
              value={item.enabled ? "active" : "inactive"}
            />
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
    [achievementCopy, copy],
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

  const buildAchievementPayload = (values: Record<string, unknown>) => ({
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
    condition: parseAchievementCondition(values.condition),
    rewardPoints: values.rewardPoints as number | undefined,
    rewardExp: values.rewardExp as number | undefined,
    rewardDecorationId:
      typeof values.rewardDecorationId === "string" && values.rewardDecorationId
        ? Number(values.rewardDecorationId)
        : undefined,
    hidden: values.hidden as boolean | undefined,
    sort: values.sort as number | undefined,
    enabled: values.enabled as boolean | undefined,
  });

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);

    try {
      await achievementControllerCreate({
        body: {
          code: (values.code as string) || "",
          name: (values.name as string) || "",
          description: (values.description as string) || "",
          icon: values.icon as string | undefined,
          type:
            (values.type as
              | "ARTICLE"
              | "COMMENT"
              | "SOCIAL"
              | "LEVEL"
              | "SPECIAL") || "SPECIAL",
          rarity:
            (values.rarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY") ||
            "COMMON",
          condition: parseAchievementCondition(values.condition),
          rewardPoints: (values.rewardPoints as number | undefined) ?? 0,
          rewardExp: (values.rewardExp as number | undefined) ?? 0,
          rewardDecorationId:
            typeof values.rewardDecorationId === "string" &&
            values.rewardDecorationId
              ? Number(values.rewardDecorationId)
              : undefined,
          hidden: (values.hidden as boolean | undefined) ?? false,
          sort: (values.sort as number | undefined) ?? 0,
          enabled: (values.enabled as boolean | undefined) ?? true,
        },
      });
      setCreating(false);
      setRefreshKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (!editingItem?.id) {
      return;
    }

    setSubmitting(true);

    try {
      await achievementControllerUpdate({
        path: { id: String(editingItem.id) },
        body: buildAchievementPayload(values),
      });
      setEditingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setSubmitting(false);
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
        action={
          <Button
            variant="primary"
            className="h-9 rounded-full px-4"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-2 size-4" />
            {copy.common.create}
          </Button>
        }
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const response = await achievementControllerFindAll({
            query: {
              keyword:
                typeof keyword === "string" && keyword ? keyword : undefined,
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
          item.id ||
          item.code ||
          `${item.name || "achievement"}-${item.type || "default"}`
        }
        emptyText={copy.empty.achievements}
        className="h-full"
      />
      <DashboardEditDialog
        open={creating}
        title={`${copy.common.create} · ${copy.pages.achievements.title}`}
        fields={editFields}
        initialValues={{
          code: "FIRST_ARTICLE",
          name: "",
          description: "",
          condition: stringifyAchievementCondition(null),
          icon: "",
          type: "SPECIAL",
          rarity: "COMMON",
          rewardPoints: 0,
          rewardExp: 0,
          rewardDecorationId: "",
          hidden: false,
          sort: 0,
          enabled: true,
        }}
        loading={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
          }
        }}
        onSubmit={handleCreate}
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.achievements.title}`}
        fields={editFields}
        initialValues={{
          code: editingItem?.code,
          name: editingItem?.name,
          description: editingItem?.description,
          condition: stringifyAchievementCondition(editingItem?.condition),
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
          await handleUpdate(values);
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
