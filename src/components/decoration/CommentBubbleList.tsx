"use client";

import { decorationControllerGetMyDecorations } from "@/api/sdk.gen";
import type { DecorationControllerGetMyDecorationsResponse } from "@/api/types.gen";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/stores/useModalStore";
import { CheckCircle2Icon, ChevronRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

type Decoration =
  DecorationControllerGetMyDecorationsResponse["data"]["data"][0];

export function CommentBubbleList() {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const openModal = useModalStore((state) => state.openModal);
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDecorations = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerGetMyDecorations({
          query: {
            type: "COMMENT_BUBBLE",
          },
        });

        if (response.data?.data) {
          setDecorations(response.data.data.data as Decoration[]);
        }
      } catch (error) {
        console.error("Failed to fetch decorations:", error);
        setDecorations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDecorations();
  }, []);

  const handleItemClick = (decoration: Decoration) => {
    openModal(MODAL_IDS.COMMENT_BUBBLE, {
      commentBubbleId: decoration.decorationId,
    });
  };

  const handleBannerClick = () => {
    // 打开第一个装饰品的对话框，如果没有则打开空对话框
    if (decorations.length > 0) {
      openModal(MODAL_IDS.COMMENT_BUBBLE, {
        commentBubbleId: decorations[0].decorationId,
      });
    } else {
      openModal(MODAL_IDS.COMMENT_BUBBLE, {});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-secondary">{tc("loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <div
          className="flex h-20 w-full items-center justify-between gap-4 rounded-xl bg-cover bg-center bg-no-repeat px-4 cursor-pointer"
          style={{
            backgroundImage: "url(/account/decoration/avatar_frame_banner.png)",
          }}
          onClick={handleBannerClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleBannerClick();
            }
          }}
        >
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[#3db8f5]">
              {t("types.commentBubble")}
            </span>
            <span className="text-xs text-secondary">
              {t("ownedHint", { count: decorations.length })}
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3db8f566] text-white">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-scroll"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {decorations.map((decoration) => (
            <button
              key={decoration.id}
              onClick={() => handleItemClick(decoration)}
              className={cn(
                "relative w-full cursor-pointer rounded-xl transition-all ring-0 outline-0 overflow-hidden",
              )}
            >
              <div className="flex items-stretch gap-2">
                {/* 左侧预览图 */}
                <div className="w-41.5 shrink-0 rounded-xl overflow-hidden border border-border p-3 relative">
                  {decoration.decoration?.imageUrl && (
                    <div className="pt-6 w-full relative">
                      <div
                        className="h-11 w-full text-center leading-11 rounded-lg text-sm text-muted-foreground"
                        style={{
                          backgroundColor:
                            decoration?.decoration?.bubbleColor || "",
                        }}
                      >
                        Hello~
                      </div>
                      {/* 定位图片 */}
                      {decoration.decoration?.imageUrl && (
                        <div className="w-full h-9 absolute top-0 overflow-hidden right-0">
                          <Image
                            src={decoration.decoration?.imageUrl}
                            alt={decoration.decoration?.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {decoration.isUsing && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2Icon size={16} className="text-primary" />
                    </div>
                  )}
                </div>

                {/* 中间信息 */}
                <div className="flex-1 flex flex-col items-start gap-1 min-w-0 ">
                  <span className="text-sm font-medium text-foreground truncate max-w-full">
                    {decoration.decoration?.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-full flex-1">
                    {decoration.decoration?.description}
                  </span>
                  <div className="flex  items-center gap-1 mt-auto text-secondary">
                    <Clock size={12} />
                    <span className="text-xs">
                      {decoration.isPermanent ? t("permanent") : t("limited")}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
