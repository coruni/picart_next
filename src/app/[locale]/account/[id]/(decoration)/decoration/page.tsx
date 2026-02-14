"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
type DecorationType = "AVATAR_FRAME" | "EMOJI" | "COMMENT";

export default function AccountDecorationPage() {
  const [activeType, setActiveType] = useState<DecorationType>("AVATAR_FRAME");

  return (
    <div className="page-container">
      <div className="flex-1 max-w-4xl mx-auto bg-card rounded-xl flex flex-col">
        <div className="px-4 h-14 flex items-center border-b border-border ">
          <div className="h-full flex-1 flex items-center">
            <span className="font-bold text-base pr-6">我的装饰品</span>
          </div>
        </div>
        <div className="flex-1 flex">
          <div
            className="p-4 overflow-y-scroll max-w-30 w-full flex-col space-y-3 border-r border-border "
            style={{ scrollbarWidth: "none" }}
          >
            <div
              onClick={() => setActiveType("AVATAR_FRAME")}
              className={cn(
                "p-2 group aspect-square cursor-pointer rounded-xl flex flex-col items-center justify-center",
                activeType === "AVATAR_FRAME"
                  ? "bg-primary/20"
                  : "hover:bg-primary/20",
              )}
            >
              <div className="relative size-16">
                <img
                  src="/account/decoration/avatar_frame.svg"
                  alt="avatar_frame"
                  className={cn(
                    "absolute w-full h-full top-50% left-50%",
                    activeType === "AVATAR_FRAME"
                      ? "hidden"
                      : "group-hover:hidden",
                  )}
                />
                <img
                  src="/account/decoration/avatar_frame_active.svg"
                  alt="avatar_frame"
                  className={cn(
                    "h-full w-full",
                    activeType === "AVATAR_FRAME"
                      ? "block"
                      : "hidden group-hover:block",
                  )}
                />
              </div>

              <span className="text-xs">头像框</span>
            </div>
            <div
              onClick={() => setActiveType("EMOJI")}
              className={cn(
                "p-2 group aspect-square cursor-pointer rounded-xl flex flex-col items-center justify-center",
                activeType === "EMOJI"
                  ? "bg-primary/20"
                  : "hover:bg-primary/20",
              )}
            >
              <div className="relative size-16">
                <img
                  src="/account/decoration/emoji.svg"
                  alt="emoji"
                  className={cn(
                    "absolute w-full h-full top-50% left-50%",
                    activeType === "EMOJI" ? "hidden" : "group-hover:hidden",
                  )}
                />
                <img
                  src="/account/decoration/emoji_active.svg"
                  alt="emoji"
                  className={cn(
                    "h-full w-full",
                    activeType === "EMOJI"
                      ? "block"
                      : "hidden group-hover:block",
                  )}
                />
              </div>

              <span className="text-xs">表情包</span>
            </div>
            <div
              onClick={() => setActiveType("COMMENT")}
              className={cn(
                "p-2 group aspect-square cursor-pointer rounded-xl flex flex-col items-center justify-center",
                activeType === "COMMENT"
                  ? "bg-primary/20"
                  : "hover:bg-primary/20",
              )}
            >
              <div className="relative size-16">
                <img
                  src="/account/decoration/comment.svg"
                  alt="comment"
                  className={cn(
                    "absolute w-full h-full top-50% left-50%",
                    activeType === "COMMENT" ? "hidden" : "group-hover:hidden",
                  )}
                />
                <img
                  src="/account/decoration/comment_active.svg"
                  alt="comment"
                  className={cn(
                    "h-full w-full",
                    activeType === "COMMENT"
                      ? "block"
                      : "hidden group-hover:block",
                  )}
                />
              </div>

              <span className="text-xs">评论装扮</span>
            </div>
          </div>
          <div className="px-4 pt-6 flex-1">
            {/* Content area based on activeType */}
            {activeType === "AVATAR_FRAME" && (
              <div className="flex flex-col">
                <div className="mb-4">
                  <div
                    className="h-20 w-full bg-center bg-cover rounded-xl bg-no-repeat flex items-center px-4 justify-between  cursor-pointer gap-4"
                    style={{
                      backgroundImage: `url(/account/decoration/avatar_frame_banner.png)`,
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-xl text-[#3db8f5] font-bold">
                        头像框
                      </span>
                      <span className="text-xs text-secondary">已拥有10个，去了解更多</span>
                    </div>

                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3db8f566] text-white">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeType === "EMOJI" && <div>表情包内容</div>}
            {activeType === "COMMENT" && <div>评论装扮内容</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
