"use client";

import { decorationControllerGetMyAchievementBadges } from "@/api";
import { cn, formatDate } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

type AchievementBadgeItem = {
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  badgeIcon?: string;
  iconUrl?: string;
  earnedAt?: string;
  claimedAt?: string;
  createdAt?: string;
  decoration?: {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    previewUrl: string;
    rarity: string;
  };
};

function resolveBadgeName(item: AchievementBadgeItem) {
  return item.decoration?.name || item.title || item.name || "-";
}

function resolveBadgeDescription(item: AchievementBadgeItem) {
  return item.decoration?.description || item.description || "";
}

function resolveBadgeImage(item: AchievementBadgeItem) {
  return (
    item.decoration?.imageUrl ||
    item.badgeIcon ||
    item.iconUrl ||
    item.imageUrl ||
    ""
  );
}

function resolveBadgeEarnedAt(item: AchievementBadgeItem) {
  return item.earnedAt || item.claimedAt || item.createdAt;
}

export function AchievementBadgeList() {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [items, setItems] = useState<AchievementBadgeItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerGetMyAchievementBadges({
          query: { page: 1, limit: 100 },
        });
        const data = response?.data as
          | {
              data?: {
                data?: AchievementBadgeItem[];
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
            <span className="text-xs text-secondary">{t("ownedHint")}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3db8f566] text-white">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-scroll" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item, index) => {
            const imageUrl = resolveBadgeImage(item);
            const earnedAt = resolveBadgeEarnedAt(item);

            return (
              <div
                key={item.id ?? `${resolveBadgeName(item)}-${index}`}
                className={cn(
                  "flex min-w-0 items-start gap-4 rounded-2xl border border-border bg-card p-4",
                )}
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={resolveBadgeName(item)}
                      fill
                      className="object-contain p-2"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-medium text-foreground">
                    {resolveBadgeName(item)}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-secondary">
                    {resolveBadgeDescription(item) || t("types.achievement")}
                  </div>
                  <div className="mt-3 text-xs text-secondary">
                    {earnedAt ? formatDate(earnedAt, locale) : t("permanent")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
