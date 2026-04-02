"use client";

import { roleControllerFindWithPagination, roleControllerUpdate } from "@/api";
import { Button } from "@/components/ui/Button";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardRoleItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

export function DashboardRolesPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardRoleItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const statusValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      true: { text: copy.status.active },
      false: { text: copy.status.inactive },
    }),
    [copy],
  );

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "name", label: copy.columns.name },
      { name: "displayName", label: copy.columns.title },
      { name: "description", label: copy.columns.description, type: "textarea" },
      { name: "isActive", label: copy.columns.status, type: "switch" },
      { name: "isSystem", label: copy.columns.system, type: "switch" },
    ],
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardRoleItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "name",
        searchPlaceholder: copy.filters.roleNamePlaceholder,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div className="font-medium">{item.displayName || item.name}</div>
            <div className="text-muted-foreground">{item.name}</div>
          </div>
        ),
      },
      {
        key: "description",
        header: copy.columns.description,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[360px]",
        getTooltip: (item) => item.description || undefined,
        render: (item) => (
          <div className="truncate text-sm text-muted-foreground">
            {item.description || "-"}
          </div>
        ),
      },
      {
        key: "permissions",
        header: copy.columns.permissions,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>{item.permissions?.length || 0}</div>
            <div className="text-muted-foreground">
              {copy.columns.system}: {item.isSystem ? copy.status.active : copy.status.inactive}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        dataIndex: "isActive",
        valueType: "select",
        valueEnum: statusValueEnum,
        render: (item) => (
          <DashboardStatusBadge value={item.isActive ? "active" : "inactive"} />
        ),
      },
      {
        key: "updatedAt",
        header: copy.columns.updatedAt,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {formatDashboardDate(item.updatedAt)}
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
    [copy, statusValueEnum],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.roles.title}
        columns={columns}
        request={async ({ current, pageSize, name, isActive }) => {
          const response = await roleControllerFindWithPagination({
            query: {
              page: current,
              limit: pageSize,
              name: typeof name === "string" && name ? name : undefined,
              isActive:
                isActive === "true" ? true : isActive === "false" ? false : undefined,
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: Number(response?.data?.data?.meta?.totalPages || 1),
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.roles}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.roles.title}`}
        fields={editFields}
        initialValues={{
          name: editingItem?.name,
          displayName: editingItem?.displayName,
          description: editingItem?.description,
          isActive: editingItem?.isActive,
          isSystem: editingItem?.isSystem,
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
            await roleControllerUpdate({
              path: { id: String(editingItem.id) },
              body: {
                name: values.name as string | undefined,
                displayName: values.displayName as string | undefined,
                description: values.description as string | undefined,
                isActive: values.isActive as boolean | undefined,
                isSystem: values.isSystem as boolean | undefined,
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
