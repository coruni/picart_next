"use client";

import { messageControllerBlockPrivateUser, reportControllerCreate } from "@/api";
import {
  createDefaultReportReasons,
  DropdownMenu,
  MenuItem,
  ReportDialog,
} from "@/components/shared";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import {
  Ban,
  HeartOff,
  MoreHorizontal,
  PencilLine,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type ArticleMenuProps = {
  articleId: string;
  authorId: string;
  articleType?: string;
  isOwner?: boolean;
};

export function ArticleMenu({
  articleId,
  authorId,
  articleType,
  isOwner: isOwnerProp = false,
}: ArticleMenuProps) {
  const t = useTranslations("articleMenu");
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const reportReasons = createDefaultReportReasons(t);

  const isOwner =
    isOwnerProp ||
    (currentUser?.id != null && String(currentUser.id) === String(authorId));

  // 检查用户是否有 article:manage 权限
  const hasManagePermission = currentUser?.roles?.some(
    (role) => role.permissions?.some(
      (permission) => permission.name === "article:manage"
    )
  ) ?? false;

  // 可以编辑的条件：是作者或有管理权限
  const canEdit = isOwner || hasManagePermission;

  const requireAuth = () => {
    if (isAuthenticated) return true;
    openLoginDialog();
    return false;
  };

  const handleOpenReportDialog = () => {
    if (!requireAuth()) return;
    setShowReportDialog(true);
  };

  const handleReportArticle = async (payload: {
    category: "SPAM" | "ABUSE" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
    reason: string;
  }) => {
    setReportSubmitting(true);
    try {
      await reportControllerCreate({
        body: {
          type: "ARTICLE",
          category: payload.category,
          reason: payload.reason,
          reportedArticleId: Number(articleId),
          reportedUserId: authorId ? Number(authorId) : undefined,
        },
      });
    } catch {
    } finally {
      setReportSubmitting(false);
      setShowReportDialog(false);
    }
  };

  const handleOpenBlockDialog = () => {
    if (!requireAuth()) return;
    setBlockDialogOpen(true);
  };

  const handleBlockUser = async () => {
    if (!requireAuth() || blockSubmitting) return;

    setBlockSubmitting(true);
    try {
      await messageControllerBlockPrivateUser({
        path: { userId: String(authorId) },
      });
      setBlockDialogOpen(false);
    } catch (error) {
      console.error("Failed to block user:", error);
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleDislikeContent = () => {
    if (!requireAuth()) return;
  };

  const handleEditArticle = () => {
    if (!canEdit) return;
    const editPath =
      articleType === "image"
        ? `/create/image?articleId=${articleId}`
        : `/create/post?articleId=${articleId}`;
    router.push(editPath);
  };

  // 基础操作项（举报、拉黑、不喜欢）- 给非作者用户
  const baseMenuItems: MenuItem[] = isOwner
    ? []
    : [
        {
          label: t("reportPost"),
          icon: <ShieldAlert size={18} />,
          onClick: handleOpenReportDialog,
          className: "text-red-400",
        },
        {
          label: t("blockUser"),
          icon: <Ban size={18} />,
          onClick: handleOpenBlockDialog,
        },
        {
          label: t("dislikeType"),
          icon: <HeartOff size={18} />,
          onClick: handleDislikeContent,
        },
      ];

  // 编辑操作项 - 给作者或有管理权限的用户
  const editMenuItem: MenuItem = {
    label: t("editPost"),
    icon: <PencilLine size={18} />,
    onClick: handleEditArticle,
  };

  // 最终菜单项：有编辑权限则添加编辑项，再加上基础操作项
  const menuItems: MenuItem[] = canEdit
    ? [editMenuItem, ...baseMenuItems]
    : baseMenuItems;

  return (
    <>
      <DropdownMenu
        trigger={({ isOpen }) => (
          <button
            className={cn(
              "flex cursor-pointer items-center transition-[color,transform] duration-180 ease-out hover:text-primary",
              isOpen && "text-primary",
            )}
          >
            <MoreHorizontal
              size={20}
              strokeWidth={2}
              className={cn(
                "transition-transform duration-180 ease-out",
                isOpen && "scale-105",
              )}
            />
          </button>
        )}
        items={menuItems}
        title={t("moreActions")}
        position="right"
      />

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reasons={reportReasons}
        loading={reportSubmitting}
        onSubmit={handleReportArticle}
      />

      {/* 拉黑确认 Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6" showClose={false}>
          <DialogHeader className="mb-0 space-y-2 text-center sm:text-center">
            <DialogTitle>{t("blockConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("blockConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-center gap-6! sm:justify-center">
            <Button
              variant="outline"
              className="h-8 rounded-full px-6 min-w-20"
              onClick={() => setBlockDialogOpen(false)}
              disabled={blockSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              className="h-8 rounded-full px-6 min-w-20"
              onClick={handleBlockUser}
              loading={blockSubmitting}
              disabled={blockSubmitting}
            >
              {t("blockUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
