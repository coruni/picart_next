"use client";

import {
  userCertificationControllerAudit,
  userCertificationControllerFindApplications,
  userCertificationControllerRevoke,
} from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Link } from "@/i18n/routing";
import { cn, getErrorMessage, showToast } from "@/lib";
import { Ban, MoreHorizontal, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

/** 认证申请（来自 userCertificationControllerFindApplications） */
type CertificationApplication = {
  id?: number;
  userId?: number;
  type?: string;
  status?: string;
  realName?: string;
  organizationName?: string;
  description?: string;
  slogan?: string;
  materials?: string[];
  reviewerId?: number;
  reviewReason?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function DashboardCertificationsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [auditItem, setAuditItem] = useState<CertificationApplication | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [revokeItem, setRevokeItem] = useState<CertificationApplication | null>(
    null,
  );
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const typeValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      OFFICIAL: { text: copy.pages.certifications.typeOptions.OFFICIAL },
      CREATOR: { text: copy.pages.certifications.typeOptions.CREATOR },
    }),
    [copy],
  );

  const statusValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      PENDING: { text: copy.status.PENDING },
      APPROVED: { text: copy.status.APPROVED },
      REJECTED: { text: copy.status.REJECTED },
      REVOKED: { text: copy.status.REVOKED },
    }),
    [copy],
  );

  const typeText = useMemo(
    () => (type?: string) =>
      type === "OFFICIAL"
        ? copy.pages.certifications.typeOptions.OFFICIAL
        : type === "CREATOR"
          ? copy.pages.certifications.typeOptions.CREATOR
          : type || "-",
    [copy],
  );

  const handleAudit = async (status: "APPROVED" | "REJECTED") => {
    if (!auditItem?.id) return;

    if (status === "REJECTED" && !rejectReason.trim()) {
      showToast(copy.pages.certifications.actions.rejectReasonRequired);
      return;
    }

    setAuditSubmitting(true);
    try {
      await userCertificationControllerAudit({
        path: { id: auditItem.id },
        body: {
          status,
          reason: status === "REJECTED" ? rejectReason.trim() : undefined,
        },
      });
      setAuditItem(null);
      setRejectReason("");
      setRefreshKey((current) => current + 1);
      showToast(
        status === "APPROVED"
          ? copy.pages.certifications.actions.approveSuccess
          : copy.pages.certifications.actions.rejectSuccess,
      );
    } catch (error) {
      console.error("Failed to audit certification:", error);
      showToast(
        getErrorMessage(
          error,
          copy.pages.certifications.actions.submitFailed,
        ),
      );
    } finally {
      setAuditSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeItem?.id) return;

    setRevokeLoading(true);
    try {
      await userCertificationControllerRevoke({
        path: { id: revokeItem.id },
      });
      setRevokeItem(null);
      setRefreshKey((current) => current + 1);
      showToast(copy.pages.certifications.actions.revokeSuccess);
    } catch (error) {
      console.error("Failed to revoke certification:", error);
      showToast(
        getErrorMessage(
          error,
          copy.pages.certifications.actions.submitFailed,
        ),
      );
    } finally {
      setRevokeLoading(false);
    }
  };

  const columns = useMemo<DashboardTableColumn<CertificationApplication>[]>(
    () => [
      {
        key: "user",
        header: copy.columns.user,
        hideInSearch: true,
        render: (item) =>
          item.userId == null ? (
            <span className="text-sm text-muted-foreground">-</span>
          ) : (
            <Link
              href={`/account/${item.userId}`}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              #{item.userId}
            </Link>
          ),
      },
      {
        key: "type",
        header: copy.columns.type,
        dataIndex: "type",
        valueType: "select",
        valueEnum: typeValueEnum,
        render: (item) => {
          const type = item.type || "";
          return (
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                type === "OFFICIAL" && "bg-blue-100 text-blue-700",
                type === "CREATOR" && "bg-green-100 text-green-700",
              )}
            >
              {typeText(type)}
            </span>
          );
        },
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
        key: "organization",
        header: copy.pages.certifications.fields.organizationName,
        hideInSearch: true,
        ellipsis: true,
        getTooltip: (item) => item.organizationName || item.realName || undefined,
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {item.organizationName || item.realName || "-"}
          </span>
        ),
      },
      {
        key: "slogan",
        header: copy.pages.certifications.fields.slogan,
        hideInSearch: true,
        ellipsis: true,
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {item.slogan || "-"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: copy.columns.createdAt,
        hideInSearch: true,
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {formatDashboardDate(item.createdAt)}
          </span>
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
              label: copy.common.audit,
              icon: <ShieldCheck size={16} />,
              onClick: () => {
                setRejectReason("");
                setAuditItem(item);
              },
            });
          } else if (item.status === "APPROVED") {
            menuItems.push({
              label: copy.pages.certifications.actions.revoke,
              icon: <Ban size={16} />,
              className: "text-red-500",
              onClick: () => setRevokeItem(item),
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
    [copy, statusValueEnum, typeText, typeValueEnum],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.certifications.title}
        columns={columns}
        expandable={{
          rowExpandable: (item) =>
            Boolean(
              item.description ||
                item.reviewReason ||
                item.reviewedAt ||
                item.materials?.length,
            ),
          expandedRowRender: (item) => (
            <div className="grid grid-cols-1 gap-3 px-6 py-3 text-sm md:grid-cols-2">
              {item.realName && (
                <div>
                  <span className="text-muted-foreground">
                    {copy.pages.certifications.fields.realName}:{" "}
                  </span>
                  {item.realName}
                </div>
              )}
              {item.reviewReason && (
                <div>
                  <span className="text-muted-foreground">
                    {copy.pages.certifications.fields.reviewReason}:{" "}
                  </span>
                  {item.reviewReason}
                </div>
              )}
              {item.reviewedAt && (
                <div>
                  <span className="text-muted-foreground">
                    {copy.pages.certifications.fields.reviewedAt}:{" "}
                  </span>
                  {formatDashboardDate(item.reviewedAt)}
                </div>
              )}
              {item.description && (
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">
                    {copy.pages.certifications.fields.description}:{" "}
                  </span>
                  <span className="whitespace-pre-wrap">
                    {item.description}
                  </span>
                </div>
              )}
              {item.materials?.length ? (
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">
                    {copy.pages.certifications.fields.materials}:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.materials.map((url) => (
                      <ImageWithFallback
                        key={url}
                        src={url}
                        width={48}
                        height={48}
                        className="size-12 rounded-md border border-border object-cover"
                        alt="material"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ),
        }}
        request={async ({ current, pageSize, status, type }) => {
          const response = await userCertificationControllerFindApplications({
            query: {
              page: current,
              limit: pageSize,
              status: typeof status === "string" ? status : "",
              type: typeof type === "string" ? type : "",
            },
          });
          const result = response?.data?.data;
          return {
            data: result?.items || [],
            total: result?.total || 0,
            totalPages: Math.max(1, Math.ceil((result?.total || 0) / pageSize)),
          };
        }}
        getRowKey={(item) =>
          item.id ?? `${item.userId ?? "u"}-${item.createdAt ?? item.updatedAt ?? "t"}`
        }
        emptyText={copy.empty.certifications}
        className="h-full"
      />

      {/* 审核对话框：通过 / 拒绝（拒绝可填原因） */}
      <Dialog
        open={Boolean(auditItem)}
        onOpenChange={(open) => {
          if (!auditSubmitting && !open) {
            setAuditItem(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-xl p-0! overflow-hidden">
          <DialogHeader className="px-6 py-4 mb-0! border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-primary" />
              {copy.pages.certifications.title} · #{auditItem?.id ?? "-"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-6">
                <span className="shrink-0 text-muted-foreground">
                  {copy.columns.user}
                </span>
                {auditItem?.userId == null ? (
                  <span>-</span>
                ) : (
                  <Link
                    href={`/account/${auditItem.userId}`}
                    className="text-primary hover:underline"
                  >
                    #{auditItem.userId}
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="shrink-0 text-muted-foreground">
                  {copy.pages.certifications.fields.type}
                </span>
                <span>{typeText(auditItem?.type)}</span>
              </div>
              {(auditItem?.organizationName || auditItem?.realName) && (
                <div className="flex items-center justify-between gap-6">
                  <span className="shrink-0 text-muted-foreground">
                    {copy.pages.certifications.fields.organizationName}
                  </span>
                  <span className="text-right">
                    {auditItem?.organizationName || auditItem?.realName}
                  </span>
                </div>
              )}
              {auditItem?.slogan && (
                <div className="flex items-center justify-between gap-6">
                  <span className="shrink-0 text-muted-foreground">
                    {copy.pages.certifications.fields.slogan}
                  </span>
                  <span className="text-right">{auditItem.slogan}</span>
                </div>
              )}
              {auditItem?.description && (
                <div>
                  <div className="text-muted-foreground">
                    {copy.pages.certifications.fields.description}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-muted-foreground">
                    {auditItem.description}
                  </p>
                </div>
              )}
              {auditItem?.materials?.length ? (
                <div>
                  <div className="text-muted-foreground">
                    {copy.pages.certifications.fields.materials}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {auditItem.materials.map((url) => (
                      <ImageWithFallback
                        key={url}
                        src={url}
                        width={64}
                        height={64}
                        className="size-16 rounded-lg border border-border object-cover"
                        alt="material"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-secondary">
                {copy.common.auditReason}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={copy.common.auditReasonPlaceholder}
                rows={3}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-primary focus:border-primary hover:border-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pb-4 px-6 border-t border-border pt-4">
            <Button
              variant="outline"
              className="h-7 rounded-full px-2"
              disabled={auditSubmitting}
              onClick={() => setAuditItem(null)}
            >
              {copy.common.cancel}
            </Button>
            <Button
              variant="danger"
              className="h-7 rounded-full px-2"
              loading={auditSubmitting}
              onClick={() => handleAudit("REJECTED")}
            >
              {copy.common.reject}
            </Button>
            <Button
              variant="primary"
              className="h-7 rounded-full px-2"
              loading={auditSubmitting}
              onClick={() => handleAudit("APPROVED")}
            >
              {copy.common.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 撤销确认 */}
      <DeleteConfirmDialog
        open={Boolean(revokeItem)}
        onOpenChange={(open) => {
          if (!open) setRevokeItem(null);
        }}
        title={copy.pages.certifications.actions.revoke}
        description={copy.pages.certifications.actions.revokeConfirm}
        onConfirm={handleRevoke}
        loading={revokeLoading}
        confirmText={copy.pages.certifications.actions.revoke}
        cancelText={copy.common.cancel}
      />
    </DashboardPageFrame>
  );
}
