"use client";

import {
  orderControllerCancelOrder,
  orderControllerGetAllOrders,
  orderControllerRequestRefund,
} from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { MoreHorizontal, RotateCcw, XCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardOrderItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

export function DashboardOrdersPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [refreshKey, setRefreshKey] = useState(0);

  const statusValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      PENDING: { text: copy.status.PENDING },
      PAID: { text: copy.status.PAID },
      CANCELLED: { text: copy.status.CANCELLED },
      REFUNDED: { text: copy.status.REFUNDED },
    }),
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardOrderItem>[]>(
    () => [
      {
        key: "orderNo",
        header: copy.columns.orderNo,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.orderPlaceholder,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div className="font-medium">{item.orderNo}</div>
            <div className="text-muted-foreground">
              {formatDashboardDate(item.createdAt)}
            </div>
          </div>
        ),
      },
      {
        key: "title",
        header: copy.columns.title,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[360px]",
        getTooltip: (item) => item.title || undefined,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div className="truncate">{item.title}</div>
            <div className="text-muted-foreground">
              {copy.columns.type}: {item.type || "-"}
            </div>
          </div>
        ),
      },
      {
        key: "amount",
        header: copy.columns.amount,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>{item.amount}</div>
            <div className="text-muted-foreground">User #{item.userId}</div>
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
          const menuItems: MenuItem[] = [];

          if (item.status === "PENDING") {
            menuItems.push({
              label: "Cancel order",
              icon: <XCircle size={16} />,
              onClick: async () => {
                if (!window.confirm("Cancel this order?")) {
                  return;
                }

                await orderControllerCancelOrder({
                  path: { id: String(item.id) },
                });
                setRefreshKey((current) => current + 1);
              },
            });
          }

          if (item.status === "PAID") {
            menuItems.push({
              label: "Refund",
              icon: <RotateCcw size={16} />,
              onClick: async () => {
                if (!window.confirm("Request refund?")) {
                  return;
                }

                await orderControllerRequestRefund({
                  path: { id: String(item.id) },
                });
                setRefreshKey((current) => current + 1);
              },
            });
          }

          if (!menuItems.length) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }

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

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.orders.title}
        columns={columns}
        request={async ({ current, pageSize, keyword, status }) => {
          const keywordValue = typeof keyword === "string" ? keyword : "";
          const statusValue = typeof status === "string" ? status : "";

          const response = await orderControllerGetAllOrders({
            query: {
              page: current,
              limit: pageSize,
              keyword: keywordValue || undefined,
              status: statusValue
                ? (statusValue as "PENDING" | "PAID" | "CANCELLED" | "REFUNDED")
                : undefined,
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.orders}
        className="h-full"
      />
    </DashboardPageFrame>
  );
}
