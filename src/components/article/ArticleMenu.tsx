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

type ArticleMenuProps = {
  articleId: string;
  authorId: string;
  isOwner?: boolean;
};

export function ArticleMenu({
  articleId,
  authorId,
  isOwner: isOwnerProp = false,
}: ArticleMenuProps) {
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
          reason: "帖子内容需要审核",
          reportedArticleId: Number(articleId),
          reportedUserId: authorId ? Number(authorId) : undefined,
        },
      });
      addNotification("success", "举报已提交");
    } catch (error) {
      console.error("Failed to report article:", error);
      addNotification("error", "举报失败，请稍后重试");
    }
  };

  const handleBlockUser = () => {
    if (!requireAuth()) return;
    addNotification("info", "已记录屏蔽该用户的操作，后续可接入正式功能");
  };

  const handleDislikeContent = () => {
    if (!requireAuth()) return;
    addNotification("info", "已记录你的内容偏好");
  };

  const handleEditArticle = () => {
    if (!isOwner) return;
    router.push(`/create/post?articleId=${articleId}`);
  };

  const menuItems: MenuItem[] = isOwner
    ? [
        {
          label: "编辑帖子",
          icon: <PencilLine size={18} />,
          onClick: handleEditArticle,
        },
      ]
    : [
        {
          label: "举报帖子",
          icon: <ShieldAlert size={18} />,
          onClick: () => void handleReportArticle(),
          className: "text-red-500",
        },
        {
          label: "屏蔽用户",
          icon: <Ban size={18} />,
          onClick: handleBlockUser,
        },
        {
          label: "我不喜欢这类内容",
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
      title="更多操作"
      position="right"
    />
  );
}
