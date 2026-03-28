"use client";

import { useState } from "react";
import {
  AudioLines,
  ChevronDown,
  Dessert,
  MoreHorizontal,
} from "lucide-react";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { useAuthNavigation } from "@/hooks/useAuthNavigation";
import { cn } from "@/lib";
import { useUserStore } from "@/stores";
import { UserDetail } from "@/types";
import { GuardedLink } from "@/components/shared/GuardedLink";
import { Avatar } from "../ui/Avatar";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";
import { BackgroundEditor } from "./BackgroundEditor.client";
import { useTranslations } from "next-intl";

type AccountInfoProps = {
  user: UserDetail;
};

export const AccountInfo = ({ user }: AccountInfoProps) => {
  const t = useTranslations("accountInfo");
  const router = useAuthNavigation();
  const scrolled = useScrollThreshold(240, true);
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
      <div className="top-header sticky z-10 box-border border-t border-t-border bg-card px-10">
        <div className="mx-auto flex h-14 max-w-7xl items-center space-x-4">
          <Avatar
            bordered
            url={user?.avatar}
            frameUrl={user?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
            className={cn(
              !scrolled ? "size-12 -top-20 md:size-24 lg:size-29.5" : "size-8",
            )}
          />

          <div className="relative h-full min-w-0 flex-1">
            <div className="flex h-full flex-1 items-center">
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-[22px]">{user?.articleCount || 0}</span>
                <span className="ml-1 text-sm text-secondary">{t("posts")}</span>
                <span className="mx-3 text-[#eceff4]">/</span>
              </div>
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-[22px]">{user.followingCount || 0}</span>
                <span className="ml-1 text-sm text-secondary">{t("following")}</span>
                <span className="mx-3 text-[#eceff4]">/</span>
              </div>
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-[22px]">{user.followerCount || 0}</span>
                <span className="ml-1 text-sm text-secondary">{t("followers")}</span>
                <span className="mx-3 text-[#eceff4]">/</span>
              </div>
              <div className="flex cursor-pointer items-center hover:text-primary">
                <span className="text-[22px]">0</span>
                <span className="ml-1 text-sm text-secondary">{t("likes")}</span>
              </div>
            </div>

            <div className="absolute -top-19 box-border flex h-19 w-full flex-col justify-center">
              <div className="mb-1 flex items-center space-x-2">
                <span className="text-xl text-white">
                  {user.nickname || user.username}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-[#ffffffa6]">
                <AudioLines size={16} />
                <span>{user.description}</span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "relative flex min-w-0 items-center space-x-3 transition-all",
              !scrolled ? "-translate-y-14" : "",
            )}
          >
            {!isSelf ? (
              <>
                <div
                  className={cn(
                    "flex size-9 cursor-pointer items-center justify-center rounded-full text-white hover:text-primary",
                    !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground",
                  )}
                >
                  <MoreHorizontal size={20} />
                </div>
                <FollowButtonWithStatus author={user} className="h-9 bg-[#e0e6ff]" />
              </>
            ) : (
              <>
                <button
                  onClick={handleToDecoration}
                  className={cn(
                    "flex size-9 cursor-pointer items-center justify-center rounded-full text-white hover:text-primary",
                    !scrolled
                      ? "bg-[#000000a6] dark:bg-[#242734]"
                      : "bg-gray-50 text-foreground dark:bg-[#242734]",
                  )}
                >
                  <Dessert size={20} />
                </button>

                <div className="group/edit relative">
                  <div
                    className={cn(
                      "flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm text-white hover:text-primary",
                      !scrolled
                        ? "bg-[#000000a6] dark:bg-[#242734]"
                        : "bg-gray-50 text-foreground dark:bg-[#242734]",
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
