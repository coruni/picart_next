"use client";

import { cn } from "@/lib";
import { useUserStore } from "@/stores";
import { ArticleDetail } from "@/types";
import { Component, IdCard, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/Button";

type UserInfoWidgetProps = {
  author?: ArticleDetail["author"];
};

export const UserInfoWidget = ({ author }: UserInfoWidgetProps) => {
  const t = useTranslations("sidebar");
  const user = useUserStore((state) => state.user);
  const userId = author?.id ?? t("unknownValue");
  const userLevel = author?.level ?? 0;
  const userBalance = author?.wallet ?? 0;
  const isOwner =
    user?.id != null &&
    author?.id != null &&
    String(user.id) === String(author.id);

  // 会员状态
  const membershipStatus = author?.membershipStatus;
  const isVip = membershipStatus === "ACTIVE";
  const membershipName = author?.membershipLevelName;

  return (
    <section className="bg-card p-4 rounded-xl">
      <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3">
        <span>{t("userInfo")}</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          <IdCard size={18} className="text-primary" />
          <span className="text-secondary text-xs flex-1">
            {t("idCard", { id: userId })}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Component size={18} className="text-[#7C6CFF]" />
          <span className="text-secondary text-xs flex-1">
            {t("level", { level: userLevel })}
          </span>
          {isVip && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                "bg-primary text-white",
              )}
              title={membershipName || t("vip")}
            >
              {t("vip")}
            </span>
          )}
        </div>
        {isOwner && (
          <div className="flex items-center space-x-1">
            <Wallet size={18} className="text-[#4F9CFF]" />
            <span className="text-secondary text-xs flex-1">
              {t("balance", { amount: userBalance })}
            </span>
            <Button className="h-full rounded-full px-2 py-0.5 text-xs">充值</Button>
          </div>
        )}
      </div>
    </section>
  );
};
