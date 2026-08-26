"use client";

import creatorBage from "@/assets/images/placeholder/createor.webp";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib";
import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";

/**
 * 创作者认证徽章：在昵称旁展示认证标识
 * - CREATOR 类型：显示创作者徽章图片
 * - 其他（如 OFFICIAL）：显示蓝底圆形 + 皇冠图标
 * 悬停显示"认证创作者"提示
 *
 * @property {object|null|undefined} certification - 认证信息（含 type）
 * @property {"top"|"bottom"|"left"|"right"} [position="top"] - Tooltip 提示位置
 * @property {string} [className] - 徽章容器附加样式
 */
type CertificationBadgeProps = {
  certification?: { type?: string } | null;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
};

export const CertificationBadge = ({
  certification,
  position = "top",
  className,
}: CertificationBadgeProps) => {
  const t = useTranslations("accountInfo");

  if (!certification) return null;

  const isOfficial = certification.type === "OFFICIAL";

  return (
    <Tooltip content={t("creatorBadge")} position={position}>
      <span
        className={cn(
          "relative size-4 cursor-pointer",
          isOfficial &&
            "p-1 rounded-full bg-[#1D9BF0] flex items-center justify-center",
          className,
        )}
      >
        {isOfficial ? (
          <Crown size={12} fill="white" stroke="white" strokeWidth={2} />
        ) : (
          <ImageWithFallback
            src={creatorBage.src}
            alt="creator badge"
            role="img"
            fill
            aria-label={t("creatorBadge")}
          />
        )}
      </span>
    </Tooltip>
  );
};
