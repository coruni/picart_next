"use client";

import { reportControllerCreate } from "@/api";
import { DropdownMenu, MenuItem } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
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
  FileWarning,
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
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const reportReasons: Array<{
    id: string;
    label: string;
    reason: string;
    category: "SPAM" | "ABUSE" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
  }> = [
    {
      id: "spam-site",
      label: t("reportOptions.spamSite"),
      reason: t("reportOptions.spamSite"),
      category: "SPAM",
    },
    {
      id: "account-trading",
      label: t("reportOptions.accountTrading"),
      reason: t("reportOptions.accountTrading"),
      category: "OTHER",
    },
    {
      id: "privacy-leak",
      label: t("reportOptions.privacyLeak"),
      reason: t("reportOptions.privacyLeak"),
      category: "INAPPROPRIATE",
    },
    {
      id: "sensitive-content",
      label: t("reportOptions.sensitiveContent"),
      reason: t("reportOptions.sensitiveContent"),
      category: "INAPPROPRIATE",
    },
    {
      id: "abuse-threat",
      label: t("reportOptions.abuseThreat"),
      reason: t("reportOptions.abuseThreat"),
      category: "ABUSE",
    },
    {
      id: "copyright",
      label: t("reportOptions.copyright"),
      reason: t("reportOptions.copyright"),
      category: "COPYRIGHT",
    },
    {
      id: "impersonation",
      label: t("reportOptions.impersonation"),
      reason: t("reportOptions.impersonation"),
      category: "OTHER",
    },
    {
      id: "community-violation",
      label: t("reportOptions.communityViolation"),
      reason: t("reportOptions.communityViolation"),
      category: "OTHER",
    },
    {
      id: "minor-safety",
      label: t("reportOptions.minorSafety"),
      reason: t("reportOptions.minorSafety"),
      category: "INAPPROPRIATE",
    },
  ];

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
    setSelectedReasonId("");
    setShowReportDialog(true);
  };

  const handleReportArticle = async () => {
    if (!requireAuth()) return;

    const selectedReason = reportReasons.find(
      (item) => item.id === selectedReasonId,
    );
    if (!selectedReason) return;

    setReportSubmitting(true);
    try {
      await reportControllerCreate({
        body: {
          type: "ARTICLE",
          category: selectedReason.category,
          reason: selectedReason.reason,
          reportedArticleId: Number(articleId),
          reportedUserId: authorId ? Number(authorId) : undefined,
        },
      });
      setShowReportDialog(false);
    } catch (error) {
      console.error("Failed to report article:", error);
    } finally {
      setReportSubmitting(false);
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
          icon: <FileWarning size={18} />,
          onClick: handleDislikeContent,
        },
      ];

  return (
    <>
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

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-sm rounded-2xl p-5 border-border! border bg-card!">
          <DialogHeader className="mb-0 flex-1 space-y-0 text-center sm:text-center">
            <DialogTitle className="text-lg font-semibold">
              {t("reportDialog.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 max-h-[55vh] overflow-y-auto -mx-2">
            {reportReasons.map((reason) => {
              const checked = selectedReasonId === reason.id;
              return (
                <button
                  key={reason.id}
                  type="button"
                  className="flex w-full transition-[opacity,transform] group focus:outline-0 cursor-pointer items-center justify-between gap-4 rounded-lg  py-3 px-2 text-left hover:bg-primary/10"
                  onClick={() => setSelectedReasonId(reason.id)}
                >
                  <span className="text-sm text-foreground">
                    {reason.label}
                  </span>
                  <div
                    className={cn(
                      "relative flex size-4 shrink-0 items-center justify-center rounded-full border-2 box-border border-gray-400 transition-colors dark:border-gray-600",
                      "group-hover:border-primary",
                      checked && "border-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full bg-primary opacity-0 transition-opacity",
                        checked && "opacity-100",
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              className="h-10 w-full rounded-full"
              disabled={!selectedReasonId || reportSubmitting}
              loading={reportSubmitting}
              onClick={() => void handleReportArticle()}
            >
              {t("reportDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
