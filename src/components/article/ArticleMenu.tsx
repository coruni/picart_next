"use client";

import { DropdownMenu, MenuItem } from "@/components/shared";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useRouter } from "@/i18n/routing";
import { reportControllerCreate } from "@/api";
import { useNotificationStore, useUserStore } from "@/stores";
import {
  Ban,
  FileWarning,
  MoreHorizontal,
  PencilLine,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";

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
  const addNotification = useNotificationStore((state) => state.addNotification);

  const isOwner =
    isOwnerProp ||
    (currentUser?.id != null && String(currentUser.id) === String(authorId));

  const requireAuth = () => {
    if (isAuthenticated) return true;
    openLoginDialog();
    return false;
  };

  const handleReportArticle = async () => {
    if (!requireAuth()) return;

    try {
      await reportControllerCreate({
        body: {
          type: "ARTICLE",
          category: "INAPPROPRIATE",
          reason: t("reportReason"),
          reportedArticleId: Number(articleId),
          reportedUserId: authorId ? Number(authorId) : undefined,
        },
      });
      addNotification("success", t("reportSubmitted"));
    } catch (error) {
      console.error("Failed to report article:", error);
      addNotification("error", t("reportFailed"));
    }
  };

  const handleBlockUser = () => {
    if (!requireAuth()) return;
    addNotification("info", t("blockRecorded"));
  };

  const handleDislikeContent = () => {
    if (!requireAuth()) return;
    addNotification("info", t("dislikeRecorded"));
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
          onClick: () => void handleReportArticle(),
          className: "text-red-500",
        },
        {
          label: t("blockUser"),
          icon: <Ban size={18} />,
          onClick: handleBlockUser,
        },
        {
          label: t("dislikeType"),
          icon: <FileWarning size={18} />,
          onClick: handleDislikeContent,
        },
      ];

  return (
    <DropdownMenu
      trigger={
        <button className="flex cursor-pointer items-center transition-colors hover:text-primary">
          <MoreHorizontal size={20} strokeWidth={2} />
        </button>
      }
      items={menuItems}
      title={t("moreActions")}
      position="right"
    />
  );
}
