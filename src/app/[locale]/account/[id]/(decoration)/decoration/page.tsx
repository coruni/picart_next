"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CheckCircle2Icon, ChevronRight, Clock } from "lucide-react";
import {
  decorationControllerFindAll,
  decorationControllerGetMyDecorations,
} from "@/api";

type DecorationType = "AVATAR_FRAME" | "EMOJI" | "COMMENT";

interface Decoration {
  id: number;
  name: string;
  type: DecorationType;
  imageUrl: string;
  previewUrl?: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  isUsing: boolean;
  isPermanent: boolean;
  expiresAt?: string;
}

export default function AccountDecorationPage() {
  const [activeType, setActiveType] = useState<DecorationType>("AVATAR_FRAME");
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(false);

  // 根据激活类型获取装饰品数据
  useEffect(() => {
    const fetchDecorations = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerFindAll({
          query: {
            type: activeType,
            status: "ACTIVE",
          },
        });

        if (response.data?.data) {
          setDecorations(response.data.data.data as Decoration[]);
        }
      } catch (error) {
        console.error("获取装饰品失败:", error);
        setDecorations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDecorations();
  }, [activeType]);

  return (
    <div className="page-container">
      <div className="flex-1 max-w-4xl mx-auto bg-card rounded-xl flex flex-col">
        <div className="px-6 h-14 flex items-center border-b border-border ">
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
                <Image
                  src="/account/decoration/avatar_frame.svg"
                  alt="avatar_frame"
                  fill
                  className={cn(
                    "absolute w-full h-full top-50% left-50%",
                    activeType === "AVATAR_FRAME"
                      ? "hidden"
                      : "group-hover:hidden",
                  )}
                />
                <Image
                  src="/account/decoration/avatar_frame_active.svg"
                  alt="avatar_frame"
                  fill
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
                <Image
                  src="/account/decoration/emoji.svg"
                  alt="emoji"
                  fill
                  className={cn(
                    "absolute w-full h-full top-50% left-50%",
                    activeType === "EMOJI" ? "hidden" : "group-hover:hidden",
                  )}
                />
                <Image
                  src="/account/decoration/emoji_active.svg"
                  alt="emoji"
                  fill
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
                <Image
                  fill
                  src="/account/decoration/comment.svg"
                  alt="comment"
                  className={cn(
                    "absolute w-full h-full top-50% left-50%",
                    activeType === "COMMENT" ? "hidden" : "group-hover:hidden",
                  )}
                />
                <Image
                  fill
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
          <div className="px-4 pt-6 flex-1 h-full">
            {/* Content area based on activeType */}
            {activeType === "AVATAR_FRAME" && (
              <div className="flex flex-col h-full">
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
                      <span className="text-xs text-secondary">
                        已拥有10个，去了解更多
                      </span>
                    </div>

                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3db8f566] text-white">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
                <div
                  className="flex-1 overflow-y-scroll"
                  style={{ scrollbarWidth: "none" }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-secondary">加载中...</div>
                    </div>
                  ) : decorations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {decorations.map((decoration) => (
                        <div
                          className="flex h-31 items-stretch cursor-pointer gap-2 group"
                          key={decoration.id}
                        >
                          <div className="flex items-center justify-center aspect-square rounded-xl bg-background relative shrink-0 relative">
                            <Image
                              fill
                              src={decoration.imageUrl}
                              alt={decoration.name}
                              className="object-cover p-4"
                            ></Image>
                            {decoration.isUsing && (
                              <div className=" absolute top-2 right-2">
                                <CheckCircle2Icon
                                  size={16}
                                  className="text-primary"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-2 relative flex flex-col">
                            <h3 className="text-sm group-hover:text-primary">
                              {decoration.name}
                            </h3>
                            <div className="flex items-center mt-auto text-secondary  text-xs gap-1">
                              <Clock size={12} />
                              <span>
                                {decoration.expiresAt
                                  ? decoration.expiresAt
                                  : "永久"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-secondary">
                      <div className="text-4xl mb-2">🎨</div>
                      <div>
                        暂无
                        {activeType === "AVATAR_FRAME"
                          ? "头像框"
                          : activeType === "EMOJI"
                            ? "表情包"
                            : "评论装扮"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeType === "EMOJI" && (
              <div className="flex flex-col h-full">
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
                      <span className="text-xs text-secondary">
                        已拥有10个，去了解更多
                      </span>
                    </div>

                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3db8f566] text-white">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
                <div
                  className="flex-1 overflow-y-scroll"
                  style={{ scrollbarWidth: "none" }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-secondary">加载中...</div>
                    </div>
                  ) : decorations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {decorations.map((decoration) => (
                        <div
                          key={decoration.id}
                          className={cn(
                            "relative rounded-xl p-4 cursor-pointer transition-all",
                            decoration.isUsing
                              ? "bg-primary/10"
                              : "bg-muted hover:bg-muted/80",
                          )}
                        >
                          {decoration.isUsing && (
                            <div className="absolute top-3 left-3 size-6 bg-primary rounded-full flex items-center justify-center">
                              <svg
                                className="size-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}

                          <div className="flex items-start gap-4">
                            <div className="relative size-20 flex-shrink-0">
                              <Image
                                fill
                                src={decoration.imageUrl}
                                alt={decoration.name}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-base mb-1 truncate">
                                {decoration.name}
                              </div>
                              <div className="text-xs text-secondary mb-2">
                                {decoration.rarity === "COMMON" && "普通"}
                                {decoration.rarity === "RARE" && "稀有"}
                                {decoration.rarity === "EPIC" && "史诗"}
                                {decoration.rarity === "LEGENDARY" && "传说"}
                                系列
                              </div>
                              <div className="flex items-center gap-1 text-xs text-secondary">
                                <svg
                                  className="size-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {decoration.isPermanent ? (
                                  <span>永久</span>
                                ) : decoration.expiresAt ? (
                                  <span>
                                    {new Date(
                                      decoration.expiresAt,
                                    ).toLocaleDateString()}
                                    到期
                                  </span>
                                ) : (
                                  <span>永久</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-secondary">
                      <div className="text-4xl mb-2">�</div>
                      <div>暂无表情包</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeType === "COMMENT" && (
              <div className="flex flex-col h-full">
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
                      <span className="text-xs text-secondary">
                        已拥有10个，去了解更多
                      </span>
                    </div>

                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3db8f566] text-white">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
                <div
                  className="flex-1 overflow-y-scroll"
                  style={{ scrollbarWidth: "none" }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-secondary">加载中...</div>
                    </div>
                  ) : decorations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {decorations.map((decoration) => (
                        <div
                          key={decoration.id}
                          className={cn(
                            "relative rounded-xl p-4 cursor-pointer transition-all",
                            decoration.isUsing
                              ? "bg-primary/10"
                              : "bg-muted hover:bg-muted/80",
                          )}
                        >
                          {decoration.isUsing && (
                            <div className="absolute top-3 left-3 size-6 bg-primary rounded-full flex items-center justify-center">
                              <svg
                                className="size-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}

                          <div className="flex items-start gap-4">
                            <div className="relative size-20 flex-shrink-0">
                              <img
                                src={decoration.imageUrl}
                                alt={decoration.name}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-base mb-1 truncate">
                                {decoration.name}
                              </div>
                              <div className="text-xs text-secondary mb-2">
                                {decoration.rarity === "COMMON" && "普通"}
                                {decoration.rarity === "RARE" && "稀有"}
                                {decoration.rarity === "EPIC" && "史诗"}
                                {decoration.rarity === "LEGENDARY" && "传说"}
                                系列
                              </div>
                              <div className="flex items-center gap-1 text-xs text-secondary">
                                <svg
                                  className="size-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {decoration.isPermanent ? (
                                  <span>永久</span>
                                ) : decoration.expiresAt ? (
                                  <span>
                                    {new Date(
                                      decoration.expiresAt,
                                    ).toLocaleDateString()}
                                    到期
                                  </span>
                                ) : (
                                  <span>永久</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-secondary">
                      <div className="text-4xl mb-2">💬</div>
                      <div>暂无评论装扮</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
