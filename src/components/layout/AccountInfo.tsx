"use client";

import { UserDetail } from "@/types"
import { Avatar } from "../ui/Avatar"
import { cn } from "@/lib"
import { MoreHorizontal } from "lucide-react"
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus"
import { useScrollThreshold } from "@/hooks/useScrollThreshold"

type AccountInfoProps = {
    user: UserDetail,
    isSelf?: boolean
}

export const AccountInfo = ({ user, isSelf }: AccountInfoProps) => {
    const scrolled = useScrollThreshold(240, true)
    return (
        <div className="px-10 z-10 sticky top-15 bg-card">
            <div className="flex items-center h-14 space-x-4">
                {/* 头像 */}
                <div className={cn(
                    "relative transition-all duration-300",
                    !scrolled ? "h-full leading-14" : "flex items-center"
                )}>
                    <Avatar
                        url={user?.avatar || '/placeholder/avatar_placeholder.png'}
                        className={cn(
                            "transition-all duration-300",
                            !scrolled ? "size-29.5 -top-20" : "size-8"
                        )}
                    />
                </div>

                {/* 信息 */}
                <div className="flex-1 h-full flex items-center">
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

                {/* 关注按钮 */}
                {!isSelf && (
                    <div className={cn("flex items-center space-x-3 relative transition-all", !scrolled ? ' -translate-y-14' : "")}>
                        <div className={cn("size-9 flex items-center text-white hover:text-primary cursor-pointer justify-center rounded-full", !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground")}>
                            <MoreHorizontal size={20} />
                        </div>
                        <FollowButtonWithStatus author={user} className="h-9 bg-[#e0e6ff]" />
                    </div>
                )}

            </div>
        </div>
    )
}