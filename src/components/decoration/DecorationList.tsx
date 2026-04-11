"use client";

import { useState, useEffect } from "react";
import { cn, formatDate } from "@/lib/utils";
import { CheckCircle2Icon, ChevronRight, Clock } from "lucide-react";
import { decorationControllerGetMyDecorations } from "@/api/sdk.gen";
import type { DecorationControllerGetMyDecorationsResponse } from "@/api/types.gen";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useModalStore } from "@/stores/useModalStore";
import { MODAL_IDS } from "@/lib/modal-helpers";

type DecorationType = "AVATAR_FRAME" | "EMOJI" | "COMMENT_BUBBLE";

type Decoration =
  DecorationControllerGetMyDecorationsResponse["data"]["data"][0];

interface DecorationListProps {
  type: DecorationType;
  showBanner?: boolean;
}

export function DecorationList({ type, showBanner = false }: DecorationListProps) {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(false);
  const openModal = useModalStore((state) => state.openModal);

  const handleAvatarFrameOpen = () => {
    if (type === "AVATAR_FRAME") {
      openModal(MODAL_IDS.AVATAR_FRAME);
    }
  };

  const getTypeName = (decorationType: DecorationType) => {
    if (decorationType === "AVATAR_FRAME") return t("types.avatarFrame");
    if (decorationType === "EMOJI") return t("types.emoji");
    return t("types.commentBubble");
  };

  const getRarityName = (rarity?: string) => {
    if (rarity === "COMMON") return t("rarity.common");
    if (rarity === "RARE") return t("rarity.rare");
    if (rarity === "EPIC") return t("rarity.epic");
    if (rarity === "LEGENDARY") return t("rarity.legendary");
    return t("rarity.common");
  };

  useEffect(() => {
    const fetchDecorations = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerGetMyDecorations({
          query: {
            type,
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
  }, [type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-secondary">{tc("loading")}</div>
      </div>
    );
  }

  if (decorations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-secondary">
        <div className="text-4xl mb-2">-</div>
        <div>{t("emptyByType", { type: getTypeName(type) })}</div>
      </div>
    );
  }

  if (type === "AVATAR_FRAME") {
    return (
      <div className="flex flex-col h-full">
        {showBanner && (
          <div className="mb-4" onClick={handleAvatarFrameOpen}>
            <div
              className="h-20 w-full bg-center bg-cover rounded-xl bg-no-repeat flex items-center px-4 justify-between cursor-pointer gap-4"
              style={{
                backgroundImage: "url(/account/decoration/avatar_frame_banner.png)",
              }}
            >
              <div className="flex flex-col">
                <span className="text-xl text-[#3db8f5] font-bold">{getTypeName(type)}</span>
                <span className="text-xs text-secondary">{t("ownedHint")}</span>
              </div>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3db8f566] text-white">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-scroll" style={{ scrollbarWidth: "none" }}>
          <div className="grid grid-cols-2 gap-4">
            {decorations.map((decoration) => (
              <div
                className="flex h-31 items-stretch cursor-pointer gap-2 group"
                key={decoration.id}
              >
                <div className="flex items-center justify-center aspect-square rounded-xl bg-background relative shrink-0 relative">
                  <Image
                    fill
                    src={decoration.decoration.imageUrl}
                    alt={decoration.decoration.name}
                    className="object-cover p-4"
                  />
                  {decoration.isUsing && (
                    <div className=" absolute top-2 right-2">
                      <CheckCircle2Icon size={16} className="text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-2 relative flex flex-col">
                  <h3 className="text-sm group-hover:text-primary">
                    {decoration.decoration.name}
                  </h3>
                  <div className="flex items-center mt-auto text-secondary  text-xs gap-1">
                    <Clock size={12} />
                    <span>
                      {decoration.expiresAt
                        ? formatDate(decoration.expiresAt, locale)
                        : t("permanent")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-scroll" style={{ scrollbarWidth: "none" }}>
      <div className="grid grid-cols-2 gap-4">
        {decorations.map((decoration) => (
          <div
            key={decoration.id}
            className={cn(
              "relative rounded-xl p-4 cursor-pointer transition-all",
              decoration.isUsing ? "bg-primary/10" : "bg-muted hover:bg-muted/80",
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
              <div className="relative size-20 shrink-0">
                <Image
                  fill
                  src={decoration.decoration.imageUrl}
                  alt={decoration.decoration.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-base mb-1 truncate">
                  {decoration.decoration.name}
                </div>
                <div className="text-xs text-secondary mb-2">
                  {getRarityName(decoration.decoration.rarity)} {t("series")}
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
                    <span>{t("permanent")}</span>
                  ) : decoration.expiresAt ? (
                    <span>
                      {formatDate(decoration.expiresAt, locale)} {t("expireAt")}
                    </span>
                  ) : (
                    <span>{t("permanent")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
