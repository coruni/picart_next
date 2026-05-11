"use client";

import type { DecorationControllerGetUserDecorationsResponse } from "@/api";
import { cn } from "@/lib";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useModalStore, useUserStore } from "@/stores";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback } from "react";
import { GuardedLink } from "../shared";
import { ImageWithFallback } from "../shared/ImageWithFallback";

type UserDecoration = NonNullable<
  DecorationControllerGetUserDecorationsResponse["data"]["data"]
>[number];

type UserAchievementWidgetProps = {
  achievements?: UserDecoration[];
  total?: number;
};

const UserAchievementWidgetComponent = ({
  achievements,
  total = 0,
}: UserAchievementWidgetProps) => {
  const t = useTranslations("sidebar");
  const currentUserId = useUserStore((state) => state.user?.id);
  const openModal = useModalStore((state) => state.openModal);

  const handleAchievementClick = useCallback(
    (achievementId: number) => {
      openModal(MODAL_IDS.ACHIEVEMENT_BADGE, { achievementId });
    },
    [openModal],
  );

  const handleViewAllClick = useCallback(() => {
    openModal(MODAL_IDS.ACHIEVEMENT_BADGE, { achievementId: 0 });
  }, [openModal]);

  const achievementHref = currentUserId
    ? `/account/${currentUserId}/decoration/achievement`
    : null;

  return (
    <section className="rounded-xl bg-card px-2 py-4">
      <div className="mb-3 px-2">
        <div className="line-clamp-1 overflow-hidden text-ellipsis leading-6 font-semibold">
          <span>{t("achievements")}</span>
        </div>
      </div>
      <div className=" grid grid-cols-4 grid-rows-3 gap-2 px-2">
        {achievements
          ?.slice(0, 11)
          ?.filter(
            (achievement) =>
              achievement?.decoration?.imageUrl &&
              !achievement?.decoration?.imageUrl.includes(
                "default-achievement-badge.png",
              ),
          )
          .map((achievement) => (
            <div
              key={achievement.id}
              onClick={() => handleAchievementClick(achievement.decorationId)}
              className={cn(
                "w-full size-17.5 inline-flex items-center justify-center cursor-pointer",
                "overflow-hidden relative transition-transform duration-300 hover:scale-110",
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleAchievementClick(achievement.decorationId);
                }
              }}
            >
              <ImageWithFallback
                src={achievement?.decoration?.imageUrl || ""}
                alt={achievement.decoration?.name || ""}
                fill
                className="size-17.5"
              />
            </div>
          ))}
        {achievementHref ? (
          <GuardedLink
            href={achievementHref}
            className={cn(
              "flex items-center justify-center size-17.5 rounded-lg cursor-pointer",
              " bg-primary/5 hover:bg-primary/10 transition-colors duration-300",
              "text-primary font-semibold",
            )}
          >
            {(total || 0) - 11 > 0 && (
              <span className="text-xs">+{(total || 0) - 11}</span>
            )}
            <ChevronRight size={20} />
          </GuardedLink>
        ) : (
          <div
            onClick={handleViewAllClick}
            className={cn(
              "flex items-center justify-center size-17.5 rounded-lg cursor-pointer",
              " bg-primary/5 hover:bg-primary/10 transition-colors duration-300",
              "text-primary font-semibold",
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleViewAllClick();
              }
            }}
          >
            {(achievements?.length || 0) - 11 > 0 && (
              <span className="text-xs">
                +{(achievements?.length || 0) - 11}
              </span>
            )}
            <ChevronRight size={20} />
          </div>
        )}
      </div>
    </section>
  );
};

UserAchievementWidgetComponent.displayName = "UserAchievementWidget";

export const UserAchievementWidget = memo(UserAchievementWidgetComponent);
