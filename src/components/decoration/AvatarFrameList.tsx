"use client";

import { decorationControllerGetMyDecorations } from "@/api/sdk.gen";
import type { DecorationControllerGetMyDecorationsResponse } from "@/api/types.gen";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { formatDate } from "@/lib/utils";
import { useModalStore } from "@/stores/useModalStore";
import { CheckCircle2Icon, ChevronRight, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

type Decoration =
  DecorationControllerGetMyDecorationsResponse["data"]["data"][0];

export function AvatarFrameList() {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(false);
  const openModal = useModalStore((state) => state.openModal);

  const handleAvatarFrameClick = (decorationId: number) => {
    openModal(MODAL_IDS.AVATAR_FRAME, { avatarFrameId: decorationId });
  };

  useEffect(() => {
    const fetchDecorations = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerGetMyDecorations({
          query: {
            type: "AVATAR_FRAME",
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
        <div>{t("emptyByType", { type: t("types.avatarFrame") })}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="mb-4"
        onClick={() => handleAvatarFrameClick(decorations[0]?.decoration.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleAvatarFrameClick(decorations[0]?.decoration.id);
          }
        }}
      >
        <div
          className="h-20 w-full bg-center bg-cover rounded-xl bg-no-repeat flex items-center px-4 justify-between cursor-pointer gap-4"
          style={{
            backgroundImage: "url(/account/decoration/avatar_frame_banner.png)",
          }}
        >
          <div className="flex flex-col">
            <span className="text-xl text-[#3db8f5] font-bold">
              {t("types.avatarFrame")}
            </span>
            <span className="text-xs text-secondary">{t("ownedHint")}</span>
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
        <div className="grid grid-cols-2 gap-4">
          {decorations.map((decoration) => (
            <div
              className="flex h-31 items-stretch cursor-pointer gap-2 group"
              key={decoration.id}
              onClick={() => handleAvatarFrameClick(decoration.decoration.id)}
            >
              <div className="flex items-center justify-center aspect-square rounded-xl bg-background relative shrink-0">
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
