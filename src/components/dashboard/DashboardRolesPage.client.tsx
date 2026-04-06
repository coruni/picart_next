"use client";

import {
  permissionControllerFindAll,
  roleControllerAssignPermissions,
  roleControllerFindWithPagination,
  roleControllerRemove,
  roleControllerUpdate,
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
import { MoreHorizontal, PencilLine, Shield, Trash2 } from "lucide-react";
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
import type { DashboardPermissionItem, DashboardRoleItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

export function DashboardRolesPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardRoleItem | null>(null);
  const [editingPermissionsItem, setEditingPermissionsItem] = useState<DashboardRoleItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DashboardRoleItem | null>(null);
  const [permissions, setPermissions] = useState<DashboardPermissionItem[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsSubmitting, setPermissionsSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const loadPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const response = await permissionControllerFindAll();
      const data = response?.data?.data?.data || [];
      setPermissions(data);
    } catch (error) {
      console.error("Failed to load permissions:", error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleOpenPermissionsDialog = async (item: DashboardRoleItem) => {
    setEditingPermissionsItem(item);
    // 设置已选中的权限
    const currentIds = item.permissions?.map((p) => p.id) || [];
    setSelectedPermissions(currentIds);
    await loadPermissions();
  };

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    if (!editingPermissionsItem?.id) return;

    setPermissionsSubmitting(true);
    try {
      await roleControllerAssignPermissions({
        path: { id: String(editingPermissionsItem.id) },
        body: {
          permissionIds: selectedPermissions,
        },
      });
      setEditingPermissionsItem(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to assign permissions:", error);
    } finally {
      setPermissionsSubmitting(false);
    }
  };

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
        render: (item) => {
          const menuItems: MenuItem[] = [
            {
              label: copy.common.edit,
              icon: <PencilLine size={16} />,
              onClick: () => setEditingItem(item),
            },
            {
              label: "配置权限",
              icon: <Shield size={16} />,
              onClick: () => handleOpenPermissionsDialog(item),
            },
            {
              label: copy.common.delete,
              icon: <Trash2 size={16} />,
              className: "text-red-500",
              disabled: item.isSystem,
              onClick: () => {
                if (item.isSystem) return;
                setDeletingItem(item);
              },
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
    [copy, statusValueEnum],
  );

  const handleDelete = async () => {
    if (!deletingItem?.id || deletingItem.isSystem) return;

    setDeleteLoading(true);
    try {
      await roleControllerRemove({
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

      {/* Permissions Dialog */}
      <Dialog
        open={Boolean(editingPermissionsItem)}
        onOpenChange={(open) => {
          if (!permissionsSubmitting && !open) {
            setEditingPermissionsItem(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] p-0! overflow-hidden">
          <DialogHeader className="px-6 py-4 mb-0! border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="size-5 text-primary" />
              配置权限 · {editingPermissionsItem?.displayName || editingPermissionsItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 px-6 overflow-y-auto max-h-[60vh]">
            {permissionsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-sm text-muted-foreground">加载中...</div>
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                暂无权限数据
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/70 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => handleTogglePermission(permission.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {permission.name}
                      </div>
                      {permission.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {permission.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-3 pb-4 px-6 border-t border-border pt-4">
            <Button
              variant="outline"
              className="h-9 rounded-full px-4"
              onClick={() => setEditingPermissionsItem(null)}
              disabled={permissionsSubmitting}
            >
              {copy.common.cancel}
            </Button>
            <Button
              variant="primary"
              className="h-9 rounded-full px-4"
              loading={permissionsSubmitting}
              onClick={handleSavePermissions}
            >
              {copy.common.save}
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
