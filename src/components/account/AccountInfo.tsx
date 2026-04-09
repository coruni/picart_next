"use client";

import { reportControllerCreate } from "@/api";
import {
  createDefaultReportReasons,
  DropdownMenu,
  GuardedLink,
  MenuItem,
  ReportDialog,
} from "@/components/shared";
import { useIsMobile } from "@/hooks";
import { useAuthNavigation } from "@/hooks/useAuthNavigation";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { cn, formatCompactNumber } from "@/lib";
import { isAccountSectionHidden } from "@/lib/account-privacy";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import { UserDetail } from "@/types";
import {
  AudioLines,
  Ban,
  ChevronDown,
  Dessert,
  MessageCircleMore,
  MoreHorizontal,
  ShieldAlert,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "../ui/Avatar";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";
import { BackgroundEditor } from "./BackgroundEditor.client";

type AccountInfoProps = {
  user: UserDetail;
};

export const AccountInfo = ({ user }: AccountInfoProps) => {
  const t = useTranslations("accountInfo");
  const tMenu = useTranslations("articleMenu");
  const locale = useLocale();
  const router = useAuthNavigation();
  const isMobile = useIsMobile();
  const scrolled = useScrollThreshold(isMobile ? 152 : 220, {
    enabled: true,
    hysteresis: isMobile ? 18 : 24,
  });
  const localUserId = useUserStore((state) => state.user)?.id;
  const isSelf = user.id === localUserId;
  const followersHidden = isAccountSectionHidden(
    user,
    "followers",
    localUserId,
  );
  const followingsHidden = isAccountSectionHidden(
    user,
    "followings",
    localUserId,
  );
  const [showBackgroundEditor, setShowBackgroundEditor] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isFollowed, setIsFollowed] = useState(Boolean(user.isFollowed));
  const reportReasons = createDefaultReportReasons(tMenu);
  const compactNumberLabels = {
    thousand: t("numberUnits.thousand"),
    tenThousand: t("numberUnits.tenThousand"),
    hundredMillion: t("numberUnits.hundredMillion"),
    million: t("numberUnits.million"),
    billion: t("numberUnits.billion"),
  };

  const requireAuth = () => {
    if (useUserStore.getState().isAuthenticated) {
      return true;
    }

    openLoginDialog();
    return false;
  };

  const handleToDecoration = () => {
    router.push({
      pathname: `/account/${user.id}/decoration`,
    });
  };

  const handleStartPrivateMessage = () => {
    if (!requireAuth() || !isFollowed) {
      return;
    }

    router.push(`/message?tab=private&userId=${user.id}`);
  };

  const handleOpenReportDialog = () => {
    if (!requireAuth()) {
      return;
    }

    setShowReportDialog(true);
  };

  const handleBlockUser = () => {
    if (!requireAuth()) {
      return;
    }

    router.push(`/setting/blocked-users?userId=${user.id}`);
  };

  const handleReportUser = async (payload: {
    category: "SPAM" | "ABUSE" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
    reason: string;
  }) => {
    setReportSubmitting(true);
    try {
      await reportControllerCreate({
        body: {
          type: "USER",
          category: payload.category,
          reason: payload.reason,
          reportedUserId: Number(user.id),
        },
      });
      setShowReportDialog(false);
    } catch (error) {
      console.error("Failed to report user:", error);
    } finally {
      setReportSubmitting(false);
    }
  };

  const accountMenuItems: MenuItem[] = [
    {
      label: isFollowed ? t("startMessage") : t("followToMessage"),
      icon: <MessageCircleMore size={18} />,
      onClick: handleStartPrivateMessage,
      disabled: !isFollowed,
    },
    {
      label: tMenu("reportUser"),
      icon: <ShieldAlert size={18} />,
      onClick: handleOpenReportDialog,
      className: "text-red-400",
    },
    {
      label: tMenu("blockUser"),
      icon: <Ban size={18} />,
      onClick: handleBlockUser,
    },
  ];

  return (
    <>
      <div className="top-header sticky z-10 box-border border-t border-t-border bg-card px-3 md:px-10">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 md:gap-4">
          <Avatar
            bordered
            url={user?.avatar}
            frameUrl={user?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
            className={cn(
              "transition-[width,height,top] duration-250 ease-out",
              !scrolled
                ? "size-11 -top-14 md:size-24 lg:size-29.5 md:-top-20"
                : "size-8",
            )}
          />

          <div className="relative h-full min-w-0 flex-1">
            <div className="flex h-full flex-1 items-center overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-lg md:text-[22px]">
                  {formatCompactNumber(user?.articleCount, {
                    locale,
                    labels: compactNumberLabels,
                  })}
                </span>
                <span className="ml-1 text-xs text-secondary md:text-sm">
                  {t("posts")}
                </span>
                <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
              </div>
              {followingsHidden ? (
                <div className="flex items-center">
                  <span className="text-lg md:text-[22px]">
                    {formatCompactNumber(user.followingCount, {
                      locale,
                      labels: compactNumberLabels,
                    })}
                  </span>
                  <span className="ml-1 text-xs text-secondary md:text-sm">
                    {t("following")}
                  </span>
                  <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
                </div>
              ) : (
                <GuardedLink
                  href={`/account/${user.id}/followings`}
                  className="flex items-center hover:text-primary"
                >
                  <span className="text-lg md:text-[22px]">
                    {formatCompactNumber(user.followingCount, {
                      locale,
                      labels: compactNumberLabels,
                    })}
                  </span>
                  <span className="ml-1 text-xs text-secondary md:text-sm">
                    {t("following")}
                  </span>
                  <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
                </GuardedLink>
              )}
              {followersHidden ? (
                <div className="flex items-center">
                  <span className="text-lg md:text-[22px]">
                    {formatCompactNumber(user.followerCount, {
                      locale,
                      labels: compactNumberLabels,
                    })}
                  </span>
                  <span className="ml-1 text-xs text-secondary md:text-sm">
                    {t("followers")}
                  </span>
                  <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
                </div>
              ) : (
                <GuardedLink
                  href={`/account/${user.id}/followers`}
                  className="flex items-center hover:text-primary"
                >
                  <span className="text-lg md:text-[22px]">
                    {formatCompactNumber(user.followerCount, {
                      locale,
                      labels: compactNumberLabels,
                    })}
                  </span>
                  <span className="ml-1 text-xs text-secondary md:text-sm">
                    {t("followers")}
                  </span>
                  <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
                </GuardedLink>
              )}
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-lg md:text-[22px]">
                  {formatCompactNumber(user.likes, {
                    locale,
                    labels: compactNumberLabels,
                  })}
                </span>
                <span className="ml-1 text-xs text-secondary md:text-sm">
                  {t("likes")}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "absolute -top-12 box-border flex h-12 w-full flex-col justify-center transition-[opacity,transform] duration-250 ease-out md:-top-19 md:h-19",
                scrolled
                  ? "pointer-events-none -translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100",
              )}
            >
              <div className="mb-0.5 flex items-center space-x-2 md:mb-1">
                <span className="text-base text-white md:text-xl">
                  {user.nickname || user.username}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-muted-foreground md:text-xs">
                <AudioLines size={14} className="shrink-0 md:size-4" />
                <span className="line-clamp-1">{user.description}</span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "relative flex min-w-0 items-center gap-2 transition-transform duration-250 ease-out md:gap-3",
              !scrolled ? "-translate-y-12 md:-translate-y-14" : "",
            )}
          >
            {!isSelf ? (
              <>
                <DropdownMenu
                  title={t("menuTitle")}
                  items={accountMenuItems}
                  trigger={({ isOpen }) => (
                    <button
                      type="button"
                      className={cn(
                        "flex size-8 cursor-pointer items-center justify-center rounded-full transition-[background-color,color,transform] duration-180 ease-out hover:text-primary md:size-9",
                        !scrolled
                          ? "bg-[#000000a6] text-white dark:text-black"
                          : "bg-gray-50 text-foreground",
                        isOpen && "scale-105 text-primary",
                      )}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  )}
                  className="shrink-0"
                  menuClassName="top-10"
                />
                <FollowButtonWithStatus
                  author={user}
                  forceShow
                  className="h-8 min-w-18 bg-[#e0e6ff] px-4 text-xs md:h-9 md:px-6 md:text-sm"
                  onFollowChange={setIsFollowed}
                />
              </>
            ) : (
              <>
                <button
                  onClick={handleToDecoration}
                  className={cn(
                    "flex size-8 cursor-pointer items-center justify-center rounded-full text-white hover:text-primary md:size-9",
                    !scrolled
                      ? "bg-[#000000a6] dark:bg-[#242734]"
                      : "bg-muted text-foreground",
                  )}
                >
                  <Dessert size={18} />
                </button>

                <div className="group/edit relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobile) {
                        setShowEditMenu((prev) => !prev);
                      }
                    }}
                    className={cn(
                      "flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-xs text-white hover:text-primary md:h-9 md:gap-2 md:px-4 md:text-sm",
                      !scrolled
                        ? "bg-[#000000a6] dark:bg-[#242734]"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {t("edit")}
                    <ChevronDown
                      size={16}
                      className={cn(
                        "transition md:group-hover/edit:rotate-180",
                        isMobile && showEditMenu ? "rotate-180" : "",
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "absolute top-full right-0 z-20 mt-2 min-w-max rounded-xl bg-card p-2 drop-shadow-xl transition-all",
                      isMobile
                        ? showEditMenu
                          ? "visible opacity-100"
                          : "pointer-events-none invisible opacity-0"
                        : "invisible opacity-0 group-hover/edit:visible group-hover/edit:opacity-100",
                    )}
                  >
                    <GuardedLink
                      onClick={() => setShowEditMenu(false)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl p-2 text-sm transition-colors hover:bg-primary/15 hover:text-primary"
                      href={`/account/${user.id}/edit`}
                    >
                      <span>{t("editProfile")}</span>
                    </GuardedLink>
                    <div
                      className="flex cursor-pointer items-center gap-2 truncate rounded-xl p-2 text-sm transition-colors hover:bg-primary/15 hover:text-primary"
                      onClick={() => {
                        setShowEditMenu(false);
                        setShowBackgroundEditor(true);
                      }}
                    >
                      <span>{t("editBackground")}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <BackgroundEditor
        user={user}
        open={showBackgroundEditor}
        onOpenChange={setShowBackgroundEditor}
      />

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reasons={reportReasons}
        loading={reportSubmitting}
        onSubmit={handleReportUser}
      />
    </>
  );
};
