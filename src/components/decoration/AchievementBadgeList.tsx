"use client";

import {
  decorationControllerGetMyDecorations,
  DecorationControllerGetMyDecorationsResponse,
} from "@/api";
import { ChevronRight, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useModalStore } from "@/stores/useModalStore";
import { formatDate } from "@/lib/utils";

type UserDecorationItem =
  DecorationControllerGetMyDecorationsResponse["data"]["data"][number];

function resolveBadgeName(item: UserDecorationItem) {
  return item.decoration?.name || "-";
}

function resolveBadgeImage(item: UserDecorationItem) {
  return item.decoration?.imageUrl || "";
}

function resolveBadgeEarnedAt(item: UserDecorationItem) {
  return item.createdAt;
}

export function AchievementBadgeList() {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const locale = useLocale();
  const openModal = useModalStore((state) => state.openModal);
  const [items, setItems] = useState<UserDecorationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerGetMyDecorations({
          query: { type: "ACHIEVEMENT_BADGE", page: 1, limit: 100 },
        });
        const data = response?.data as
          | {
              data?: {
                data?: UserDecorationItem[];
              };
            }
          | undefined;

        setItems(data?.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch achievement badges:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchBadges();
  }, []);

  const handleItemClick = (item: UserDecorationItem) => {
    openModal(MODAL_IDS.ACHIEVEMENT_BADGE, { achievementId: item.decorationId });
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="text-secondary">{tc("loading")}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-secondary">
        <div className="mb-2 text-4xl">-</div>
        <div>{t("emptyByType", { type: t("types.achievement") })}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Banner */}
      <div className="mb-4">
        <div
          className="flex h-20 w-full items-center justify-between gap-4 rounded-xl bg-cover bg-center bg-no-repeat px-4"
          style={{
            backgroundImage: "url(/account/decoration/avatar_frame_banner.png)",
          }}
        >
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[#3db8f5]">
              {t("types.achievement")}
            </span>
            <span className="text-xs text-secondary">{t("ownedHint", { count: items.length })}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3db8f566] text-white">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
          {items.map((item, index) => {
            const imageUrl = resolveBadgeImage(item);
            const earnedAt = resolveBadgeEarnedAt(item);

            return (
              <div
                key={item.id ?? `${resolveBadgeName(item)}-${index}`}
                className="flex cursor-pointer flex-col items-center rounded-2xl bg-muted p-4 hover:bg-primary/15"
                onClick={() => handleItemClick(item)}
              >
                {/* Badge Image */}
                <div className="relative my-3 aspect-square size-26 w-full overflow-hidden md:size-30">
                  {imageUrl ? (
                    <ImageWithFallback
                      src={imageUrl}
                      alt={resolveBadgeName(item)}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      -
                    </div>
                  )}
                </div>

                {/* Badge Name */}
                <div className="my-2 text-center text-sm font-semibold">
                  {resolveBadgeName(item)}
                </div>

                {/* Earned Date */}
                {earnedAt && (
                  <div className="flex items-center gap-1 pt-3 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{formatDate(earnedAt, locale)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
