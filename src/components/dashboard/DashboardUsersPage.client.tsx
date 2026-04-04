"use client";

import { userControllerFindAll, userControllerRemove, userControllerUpdate } from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/routing";
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
import type { DashboardUserItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import {
  formatDashboardCount,
  formatDashboardDate,
  getRoleLabels,
} from "./utils";

export function DashboardUsersPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardUserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "username", label: "Username" },
      { name: "nickname", label: copy.columns.name },
      { name: "password", label: "Password", type: "text", placeholder: copy.common.passwordPlaceholder },
      { name: "avatar", label: "Avatar", type: "image" },
      { name: "background", label: "Background", type: "image" },
      { name: "description", label: copy.columns.description, type: "textarea" },
      {
        name: "status",
        label: copy.columns.status,
        type: "select",
        options: [
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "INACTIVE", label: "INACTIVE" },
          { value: "BANNED", label: "BANNED" },
        ],
      },
      { name: "banReason", label: copy.pages.users.fields.banReason, type: "textarea" },
      { name: "address", label: copy.pages.users.fields.address, type: "text" },
      {
        name: "gender",
        label: copy.pages.users.fields.gender,
        type: "select",
        options: [
          { value: "male", label: copy.pages.users.gender.male },
          { value: "female", label: copy.pages.users.gender.female },
          { value: "other", label: copy.pages.users.gender.other },
        ],
      },
      { name: "birthDate", label: copy.pages.users.fields.birthDate, type: "date" },
      { name: "wallet", label: copy.pages.users.fields.wallet, type: "number", min: 0 },
      { name: "inviteCode", label: copy.pages.users.fields.inviteCode, type: "text" },
      { name: "membershipLevel", label: copy.pages.users.fields.membershipLevel, type: "number", min: 0 },
      { name: "membershipLevelName", label: copy.pages.users.fields.membershipLevelName, type: "text" },
      {
        name: "membershipStatus",
        label: copy.pages.users.fields.membershipStatus,
        type: "select",
        options: [
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "INACTIVE", label: "INACTIVE" },
        ],
      },
      { name: "membershipStartDate", label: copy.pages.users.fields.membershipStartDate, type: "date" },
      { name: "membershipEndDate", label: copy.pages.users.fields.membershipEndDate, type: "date" },
    ],
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardUserItem>[]>(
    () => [
      {
        key: "user",
        header: copy.columns.user,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.keywordPlaceholder,
        render: (item) => (
          <Link
            href={`/account/${item.id}`}
            className="flex min-w-0 items-center gap-3"
          >
            <Avatar
              url={item.avatar}
              frameUrl={item.equippedDecorations?.AVATAR_FRAME?.imageUrl}
              className="size-10 shrink-0"
              alt={item.nickname || item.username}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.nickname || item.username}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                @{item.username}
              </div>
            </div>
          </Link>
        ),
      },
      {
        key: "roles",
        header: copy.columns.roles,
        hideInSearch: true,
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            {getRoleLabels(item.roles).length ? (
              getRoleLabels(item.roles).map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      {
        key: "stats",
        header: copy.columns.posts,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.posts}:{" "}
              {formatDashboardCount(item.articleCount || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.followers}:{" "}
              {formatDashboardCount(item.followerCount || 0, locale)}
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
      {
        key: "updatedAt",
        header: copy.columns.updatedAt,
        hideInSearch: true,
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {formatDashboardDate(item.updatedAt)}
          </span>
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
              label: copy.common.delete,
              icon: <Trash2 size={16} />,
              className: "text-red-500",
              onClick: async () => {
                if (!window.confirm(copy.common.deleteConfirm)) {
                  return;
                }

                await userControllerRemove({
                  path: { id: String(item.id) },
                });
                setRefreshKey((current) => current + 1);
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
    [copy, locale],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.users.title}
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const keywordValue = typeof keyword === "string" ? keyword : "";

          const response = await userControllerFindAll({
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
        emptyText={copy.empty.users}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} ${copy.pages.users.title}`}
        fields={editFields}
        initialValues={{
          username: editingItem?.username,
          nickname: editingItem?.nickname,
          avatar: editingItem?.avatar,
          background: editingItem?.background,
          description: editingItem?.description,
          status: editingItem?.status,
          banReason: editingItem?.banReason,
          address: editingItem?.address,
          gender: editingItem?.gender,
          birthDate: editingItem?.birthDate,
          wallet: editingItem?.wallet,
          inviteCode: editingItem?.inviteCode,
          membershipLevel: editingItem?.membershipLevel,
          membershipLevelName: editingItem?.membershipLevelName,
          membershipStatus: editingItem?.membershipStatus,
          membershipStartDate: editingItem?.membershipStartDate,
          membershipEndDate: editingItem?.membershipEndDate,
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
            await userControllerUpdate({
              path: { id: String(editingItem.id) },
              body: {
                username: values.username as string | undefined,
                nickname: values.nickname as string | undefined,
                password: values.password as string | undefined,
                avatar: values.avatar as string | undefined,
                background: values.background as string | undefined,
                description: values.description as string | undefined,
                status: values.status as "ACTIVE" | "INACTIVE" | "BANNED" | undefined,
                banReason: values.banReason as string | undefined,
                address: values.address as string | undefined,
                gender: values.gender as "male" | "female" | "other" | undefined,
                birthDate: values.birthDate as string | undefined,
                wallet: values.wallet as number | undefined,
                inviteCode: values.inviteCode as string | undefined,
                membershipLevel: values.membershipLevel as number | undefined,
                membershipLevelName: values.membershipLevelName as string | undefined,
                membershipStatus: values.membershipStatus as "ACTIVE" | "INACTIVE" | undefined,
                membershipStartDate: values.membershipStartDate as string | undefined,
                membershipEndDate: values.membershipEndDate as string | undefined,
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
