"use client";

import { GuardedLink } from "@/components/shared/GuardedLink";
import { useIsMobile } from "@/hooks";
import { useAuthNavigation } from "@/hooks/useAuthNavigation";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { cn } from "@/lib";
import { useUserStore } from "@/stores";
import { UserDetail } from "@/types";
import { AudioLines, ChevronDown, Dessert, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "../ui/Avatar";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";
import { BackgroundEditor } from "./BackgroundEditor.client";

type AccountInfoProps = {
  user: UserDetail;
};

export const AccountInfo = ({ user }: AccountInfoProps) => {
  const t = useTranslations("accountInfo");
  const router = useAuthNavigation();
  const isMobile = useIsMobile();
  const scrolled = useScrollThreshold(isMobile ? 152 : 220, {
    enabled: true,
    hysteresis: isMobile ? 18 : 24,
  });
  const localUserId = useUserStore((state) => state.user)?.id;
  const isSelf = user.id === localUserId;
  const [showBackgroundEditor, setShowBackgroundEditor] = useState(false);

  const handleToDecoration = () => {
    router.push({
      pathname: `/account/${user.id}/decoration`,
    });
  };

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
                  {user?.articleCount || 0}
                </span>
                <span className="ml-1 text-xs text-secondary md:text-sm">
                  {t("posts")}
                </span>
                <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
              </div>
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-lg md:text-[22px]">
                  {user.followingCount || 0}
                </span>
                <span className="ml-1 text-xs text-secondary md:text-sm">
                  {t("following")}
                </span>
                <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
              </div>
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-lg md:text-[22px]">
                  {user.followerCount || 0}
                </span>
                <span className="ml-1 text-xs text-secondary md:text-sm">
                  {t("followers")}
                </span>
                <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
              </div>
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-lg md:text-[22px]">0</span>
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
              !scrolled ? "-translate-y-10 md:-translate-y-14" : "",
            )}
          >
            {!isSelf ? (
              <>
                <div
                  className={cn(
                    "flex size-8 cursor-pointer items-center justify-center rounded-full text-white hover:text-primary md:size-9",
                    !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground",
                  )}
                >
                  <MoreHorizontal size={18} />
                </div>
                <FollowButtonWithStatus
                  author={user}
                  className="h-8 min-w-18 bg-[#e0e6ff] px-4 text-xs md:h-9 md:px-6 md:text-sm"
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
                  <div
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
                      className="transition group-hover/edit:rotate-180"
                    />
                  </div>

                  <div className="invisible absolute top-full right-0 z-20 mt-2 w-40 rounded-xl bg-card p-2 opacity-0 drop-shadow-xl transition-all group-hover/edit:visible group-hover/edit:opacity-100">
                    <GuardedLink
                      className="flex cursor-pointer items-center gap-2 rounded-xl p-2 text-sm transition-colors hover:bg-primary/15 hover:text-primary"
                      href={`/account/${user.id}/edit`}
                    >
                      <span>{t("editProfile")}</span>
                    </GuardedLink>
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-xl p-2 text-sm transition-colors hover:bg-primary/15 hover:text-primary"
                      onClick={() => setShowBackgroundEditor(true)}
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
    </>
  );
};
