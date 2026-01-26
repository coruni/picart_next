"use client";

import { TagDetail } from "@/types"
import { Avatar } from "../ui/Avatar"
import { cn } from "@/lib"
import { MoreHorizontal } from "lucide-react"
import { useScrollThreshold } from "@/hooks/useScrollThreshold"
import { Button } from "../ui/Button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { tagControllerFollow, tagControllerUnfollow } from "@/api";

type TopicInfoProps = {
    tag: TagDetail,
    isFollowed?: boolean
}

export const TopicInfo = ({ tag, isFollowed: initialIsFollowed }: TopicInfoProps) => {
    const scrolled = useScrollThreshold(240, true);
    const tButton = useTranslations('followButton');
    const [isFollowed, setIsFollowed] = useState(initialIsFollowed || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollowToggle = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            if (isFollowed) {
                // 取消关注
                await tagControllerUnfollow({
                    path: { id: tag.id.toString() }
                });
                setIsFollowed(false);
            } else {
                // 关注
                await tagControllerFollow({
                    path: { id: tag.id.toString() }
                });
                setIsFollowed(true);
            }
        } catch (error) {
            console.error('Follow/unfollow tag failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="px-10 z-10 sticky top-15 bg-card border-t-border border-t">
            <div className="flex items-center h-14 space-x-4">
                {/* 头像 */}
                <div className={cn(
                    "relative transition-all duration-300",
                    !scrolled ? "h-full leading-14" : "flex items-center"
                )}>
                    <Avatar
                        url={tag?.avatar || '/placeholder/avatar_placeholder.png'}
                        className={cn(
                            "transition-all duration-300 rounded-xl!",
                            !scrolled ? "size-29.5 -top-20" : "size-8"
                        )}
                    />
                </div>

                {/* 信息 */}
                <div className="flex-1 h-full relative">
                    <div className="flex items-center h-full flex-1">
                        <div className="flex items-center hover:text-primary cursor-pointer">
                            <span className="text-[22px]">{tag?.articleCount || 0}</span>
                            <span className="text-secondary ml-1 text-sm">投稿数</span>
                            <span className="mx-3 text-[#eceff4]">/</span>
                        </div>
                        <div className="flex items-center hover:text-primary cursor-pointer">
                            <span className="text-[22px]">{tag.followCount || 0}</span>
                            <span className="text-secondary ml-1 text-sm">成员数</span>
                        </div>
                    </div>
                    {/* 用户信息 */}
                    <div className="absolute box-border w-full -top-19 flex flex-col h-19 justify-center">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className=" text-xl text-white">{tag.name}</span>
                        </div>
                        <div className="flex items-center text-xs space-x-1 text-[#ffffffa6]">
                            <span>{tag.description}</span>
                        </div>
                    </div>

                </div>

                {/* 关注按钮 */}
                {!isFollowed && (
                    <div className={cn("flex items-center space-x-3 relative transition-all", !scrolled ? ' -translate-y-14' : "")}>
                        <div className={cn("size-9 flex items-center text-white hover:text-primary cursor-pointer justify-center rounded-full", !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground")}>
                            <MoreHorizontal size={20} />
                        </div>
                        <Button
                            className={cn(`ml-2 rounded-full px-6 h-9 bg-[#e0e6ff]`)}
                            onClick={handleFollowToggle}
                            disabled={isLoading}
                            size="md"
                        >
                            <span className="text-xs">
                                {isLoading
                                    ? '...'
                                    : isFollowed
                                        ? tButton('following')
                                        : tButton('follow')
                                }
                            </span>

                        </Button>
                    </div>
                )}

            </div>
        </div>
    )
}