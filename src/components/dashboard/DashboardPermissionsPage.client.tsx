"use client";

import { permissionControllerFindAll, permissionControllerUpdate } from "@/api";
import { Button } from "@/components/ui/Button";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardPermissionItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";

export function DashboardPermissionsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardPermissionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "name", label: copy.columns.name },
      { name: "description", label: copy.columns.description, type: "textarea" },
    ],
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardPermissionItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.keywordPlaceholder,
        render: (item) => (
          <div className="text-sm font-medium text-foreground">{item.name}</div>
        ),
      },
      {
        key: "description",
        header: copy.columns.description,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[420px]",
        getTooltip: (item) => item.description || undefined,
        render: (item) => (
          <div className="truncate text-sm text-muted-foreground">
            {item.description || "-"}
          </div>
        ),
      },
      {
        key: "action",
        header: copy.columns.action,
        hideInSearch: true,
        render: (item) => (
          <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
            {copy.common.edit}
          </Button>
        ),
      },
    ],
    [copy],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.permissions.title}
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const response = await permissionControllerFindAll();
          const rows = response?.data?.data?.data || [];
          const normalizedKeyword =
            typeof keyword === "string" ? keyword.trim().toLowerCase() : "";
          const filteredRows = rows.filter((item) => {
            if (!normalizedKeyword) {
              return true;
            }

            return (
              item.name?.toLowerCase().includes(normalizedKeyword) ||
              item.description?.toLowerCase().includes(normalizedKeyword)
            );
          });
          const start = (current - 1) * pageSize;

          return {
            data: filteredRows.slice(start, start + pageSize),
            total: filteredRows.length,
            totalPages: Math.max(1, Math.ceil(filteredRows.length / pageSize)),
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.permissions}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.permissions.title}`}
        fields={editFields}
        initialValues={{
          name: editingItem?.name,
          description: editingItem?.description,
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

          setSubmitting(true);

          try {
            await permissionControllerUpdate({
              path: { id: String(editingItem.id) },
              body: {
                name: values.name as string | undefined,
                description: values.description as string | undefined,
              },
            });
            setEditingItem(null);
            setRefreshKey((current) => current + 1);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </DashboardPageFrame>
  );
}
