"use client";

import {
  articleControllerRemove,
  articleControllerSetFeatured,
  articleControllerSetProfilePin,
  messageControllerBlockPrivateUser,
  reportControllerCreate,
} from "@/api";
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
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import {
  Ban,
  HeartOff,
  MoreHorizontal,
  PencilLine,
  Pin,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type ArticleMenuProps = {
  articleId: string;
  authorId: string;
  articleType?: string;
  isOwner?: boolean;
  isFeatured?: boolean;
  isPinnedOnProfile?: boolean;
};

export function ArticleMenu({
  articleId,
  authorId,
  articleType,
  isOwner: isOwnerProp = false,
  isFeatured = false,
  isPinnedOnProfile = false,
}: ArticleMenuProps) {
  const t = useTranslations("articleMenu");
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [featureSubmitting, setFeatureSubmitting] = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [featuredState, setFeaturedState] = useState(Boolean(isFeatured));
  const [profilePinnedState, setProfilePinnedState] = useState(
    Boolean(isPinnedOnProfile),
  );
  const reportReasons = createDefaultReportReasons(t);

  const isOwner =
    isOwnerProp ||
    (currentUser?.id != null && String(currentUser.id) === String(authorId));

  // 检查用户是否有 article:manage 权限
  const hasManagePermission =
    currentUser?.roles?.some((role) =>
      role.permissions?.some(
        (permission) => permission.name === "article:manage",
      ),
    ) ?? false;

  // 可以编辑的条件：是作者或有管理权限
  const canEdit = isOwner || hasManagePermission;
  const canDelete = canEdit;
  const canManageFeature = hasManagePermission;
  const canManageProfilePin = isOwner;
  const isAccountArticleRoute = pathname === `/account/${authorId}`;

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

  const handleToggleFeatured = async () => {
    if (!canManageFeature || featureSubmitting) return;

    const nextFeatured = !featuredState;
    setFeatureSubmitting(true);
    try {
      await articleControllerSetFeatured({
        path: { id: articleId },
        body: { isFeatured: nextFeatured },
      });
      setFeaturedState(nextFeatured);
      router.refresh();
    } catch (error) {
      console.error("Failed to update article featured state:", error);
    } finally {
      setFeatureSubmitting(false);
    }
  };

  const handleToggleProfilePin = async () => {
    if (!canManageProfilePin || pinSubmitting || !isAccountArticleRoute) return;

    const nextPinned = !profilePinnedState;
    setPinSubmitting(true);
    try {
      await articleControllerSetProfilePin({
        path: { id: articleId },
        body: { isPinned: nextPinned },
      });
      setProfilePinnedState(nextPinned);
      router.refresh();
    } catch (error) {
      console.error("Failed to update article profile pin state:", error);
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!canDelete || deleteSubmitting) return;

    setDeleteSubmitting(true);
    try {
      await articleControllerRemove({
        path: { id: articleId },
      });
      setDeleteDialogOpen(false);

      if (pathname.startsWith("/article/")) {
        router.replace("/");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to delete article:", error);
    } finally {
      setDeleteSubmitting(false);
    }
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

  const manageMenuItems: MenuItem[] = [];

  if (canManageFeature) {
    manageMenuItems.push({
      label: featuredState ? t("unsetFeatured") : t("setFeatured"),
      icon: <Sparkles size={18} />,
      onClick: handleToggleFeatured,
      disabled: featureSubmitting,
      confirmDialog: {
        enabled: true,
        title: featuredState
          ? t("unsetFeaturedConfirmTitle")
          : t("setFeaturedConfirmTitle"),
        description: featuredState
          ? t("unsetFeaturedConfirmDescription")
          : t("setFeaturedConfirmDescription"),
        confirmText: featuredState ? t("unsetFeatured") : t("setFeatured"),
        cancelText: t("cancel"),
      },
    });
  }

  if (canManageProfilePin && isAccountArticleRoute) {
    manageMenuItems.push({
      label: profilePinnedState ? t("unsetProfilePin") : t("setProfilePin"),
      icon: <Pin size={18} />,
      onClick: handleToggleProfilePin,
      disabled: pinSubmitting,
      confirmDialog: {
        enabled: true,
        title: profilePinnedState
          ? t("unsetProfilePinConfirmTitle")
          : t("setProfilePinConfirmTitle"),
        description: profilePinnedState
          ? t("unsetProfilePinConfirmDescription")
          : t("setProfilePinConfirmDescription"),
        confirmText: profilePinnedState
          ? t("unsetProfilePin")
          : t("setProfilePin"),
        cancelText: t("cancel"),
      },
    });
  }

  if (canDelete) {
    manageMenuItems.push({
      label: t("deletePost"),
      icon: <Trash2 size={18} />,
      onClick: () => setDeleteDialogOpen(true),
      className: "text-red-400",
      disabled: deleteSubmitting,
    });
  }

  // 最终菜单项：有编辑权限则添加编辑项，再加上基础操作项
  const menuItems: MenuItem[] = canEdit
    ? [editMenuItem, ...manageMenuItems, ...baseMenuItems]
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
              className={cn("transition-transform duration-180 ease-out")}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6" showClose={false}>
          <DialogHeader className="mb-0 space-y-2 text-center sm:text-center">
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-center gap-6! sm:justify-center">
            <Button
              variant="outline"
              className="h-8 min-w-20 rounded-full px-6"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              className="h-8 min-w-20 rounded-full px-6"
              onClick={handleDeleteArticle}
              loading={deleteSubmitting}
              disabled={deleteSubmitting}
            >
              {t("deletePost")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
