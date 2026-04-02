"use client";

import { reportControllerCreate } from "@/api";
import {
  createDefaultReportReasons,
  DropdownMenu,
  MenuItem,
  ReportDialog,
} from "@/components/shared";
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
  const reportReasons = createDefaultReportReasons(t);

  const isOwner =
    isOwnerProp ||
    (currentUser?.id != null && String(currentUser.id) === String(authorId));

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

  const handleBlockUser = () => {
    if (!requireAuth()) return;
  };

  const handleDislikeContent = () => {
    if (!requireAuth()) return;
  };

  const handleEditArticle = () => {
    if (!isOwner) return;
    const editPath =
      articleType === "image"
        ? `/create/image?articleId=${articleId}`
        : `/create/post?articleId=${articleId}`;
    router.push(editPath);
  };

  const menuItems: MenuItem[] = isOwner
    ? [
        {
          label: t("editPost"),
          icon: <PencilLine size={18} />,
          onClick: handleEditArticle,
        },
      ]
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
          onClick: handleBlockUser,
        },
        {
          label: t("dislikeType"),
          icon: <HeartOff size={18} />,
          onClick: handleDislikeContent,
        },
      ];

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
    </>
  );
}
