"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/lib";
import { MODAL_IDS, openModal } from "@/lib/modal-helpers";
import type { KeyboardEvent, MouseEvent } from "react";

/**
 * 成就徽章：展示成就图标，点击打开成就详情弹窗
 *
 * @property {object|null} achievement - 成就徽章信息（equippedDecorations.ACHIEVEMENT_BADGE）
 * @property {string} [className] - 附加样式
 */
type AchievementBadgeProps = {
  achievement?: {
    id?: number;
    name?: string;
    imageUrl?: string;
  } | null;
  className?: string;
};

export const AchievementBadge = ({
  achievement,
  className,
}: AchievementBadgeProps) => {
  if (!achievement?.imageUrl) return null;

  const stop = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (
      e.nativeEvent as Event & { stopImmediatePropagation?: () => void }
    ).stopImmediatePropagation?.();
  };

  const open = () => {
    if (achievement.id != null) {
      openModal(MODAL_IDS.ACHIEVEMENT_BADGE, {
        achievementId: achievement.id,
      });
    } else {
      openModal(MODAL_IDS.ACHIEVEMENT_BADGE);
    }
  };

  return (
    <span
      className={cn("relative size-4 cursor-pointer", className)}
      data-auto-translate-content
      data-guarded-link-ignore="true"
      onClick={(e) => {
        stop(e);
        open();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        stop(e);
        open();
      }}
      role="button"
      tabIndex={0}
    >
      <ImageWithFallback
        src={achievement.imageUrl}
        alt={achievement.name || "achievement badge"}
        title={achievement.name}
        width={16}
        height={16}
        className="object-contain"
      />
    </span>
  );
};
