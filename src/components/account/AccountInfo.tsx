"use client";

import { UserDetail } from "@/types";
import { Avatar } from "../ui/Avatar";
import { cn } from "@/lib";
import { AudioLines, ChevronDown, Diamond, MoreHorizontal, Sparkle } from "lucide-react";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { useUserStore } from "@/stores";
import { Link } from "@/i18n/routing";

type AccountInfoProps = {
  user: UserDetail;
};

export const AccountInfo = ({ user }: AccountInfoProps) => {
  const scrolled = useScrollThreshold(240, true);
  const localUserId = useUserStore((state) => state.user)?.id;
  const isSelf = user.id === localUserId;
  return (
    <div className="px-10 z-10 sticky top-15 bg-card border-t-border border-t box-border">
      <div className="flex items-center h-14 space-x-4">
        {/* 头像 */}
        <div
          className={cn(
            "relative transition-all duration-300",
            !scrolled ? "h-full leading-14" : "flex items-center",
          )}
        >
          <Avatar
            url={user?.avatar || "/placeholder/avatar_placeholder.png"}
            className={cn(
              "transition-all duration-300",
              !scrolled ? "size-12 md:size-24 lg:size-29.5 -top-20" : "size-8",
            )}
          />
        </div>

        {/* 信息 */}
        <div className="flex-1 h-full relative min-w-0">
          <div className="flex items-center h-full flex-1">
            <div className="flex items-center hover:text-primary cursor-pointer">
              <span className="text-[22px]">{user?.articleCount || 0}</span>
              <span className="text-secondary ml-1 text-sm">帖子</span>
              <span className="mx-3 text-[#eceff4]">/</span>
            </div>
            <div className="flex items-center hover:text-primary cursor-pointer">
              <span className="text-[22px]">{user.followingCount || 0}</span>
              <span className="text-secondary ml-1 text-sm">关注</span>
              <span className="mx-3 text-[#eceff4]">/</span>
            </div>
            <div className="flex items-center hover:text-primary cursor-pointer">
              <span className="text-[22px]">{user.followerCount || 0}</span>
              <span className="text-secondary ml-1 text-sm">粉丝</span>
              <span className="mx-3 text-[#eceff4]">/</span>
            </div>
            <div className="flex items-center hover:text-primary cursor-pointer">
              <span className="text-[22px]">{0}</span>
              <span className="text-secondary ml-1 text-sm">获赞</span>
            </div>
          </div>
          {/* 用户信息 */}
          <div className="absolute box-border w-full -top-19 flex flex-col h-19 justify-center">
            <div className="flex items-center space-x-2 mb-1">
              <span className=" text-xl text-white">
                {user.nickname || user.username}
              </span>
            </div>
            <div className="flex items-center text-xs space-x-1 text-[#ffffffa6]">
              <AudioLines size={16} />
              <span>{user.description}</span>
            </div>
          </div>
        </div>

        {/* 关注按钮 */}
        <div
          className={cn(
            "flex items-center space-x-3 relative transition-all min-w-0",
            !scrolled ? " -translate-y-14" : "",
          )}
        >
          {!isSelf ? (
            <>
              <div
                className={cn(
                  "size-9 flex items-center text-white hover:text-primary cursor-pointer justify-center rounded-full",
                  !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground",
                )}
              >
                <MoreHorizontal size={20} />
              </div>
              <FollowButtonWithStatus
                author={user}
                className="h-9 bg-[#e0e6ff]"
              />
            </>
          ) : (
            <>
              <div
                className={cn(
                  "size-9 flex items-center text-white hover:text-primary cursor-pointer justify-center rounded-full",
                  !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground",
                )}
              >
                <Sparkle size={20} />
              </div>
              <div className="relative group/edit">
                <div
                  className={cn(
                    "h-9 px-4 flex gap-2 items-center text-white hover:text-primary cursor-pointer justify-center rounded-full",
                    !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground",
                  )}
                >
                  编辑
                  <ChevronDown
                    size={16}
                    className="group-hover/edit:rotate-180 transition"
                  />
                </div>
                <div className="absolute top-full right-0 mt-2 w-40 bg-card rounded-xl drop-shadow-xl z-20 p-2 opacity-0 invisible group-hover/edit:opacity-100 group-hover/edit:visible transition-all">
                  <Link
                    className="cursor-pointer p-2 text-sm rounded-xl flex items-center gap-2 hover:bg-primary/15 hover:text-primary transition-colors"
                    href={`/account/${user.id}/edit`}
                  >
                    <span>编辑资料</span>
                  </Link>
                  <div className="cursor-pointer p-2 text-sm rounded-xl flex items-center gap-2 hover:bg-primary/15 hover:text-primary transition-colors">
                    <span>修改背景</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
