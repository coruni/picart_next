"use client";

import { tagControllerFollow, tagControllerUnfollow } from "@/api";
import noTag from "@/assets/images/placeholder/no_tag.webp";
import { DropdownMenu, MenuItem } from "@/components/shared";
import { useIsMobile } from "@/hooks";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { cn, formatCompactNumber } from "@/lib";
import { TagDetail } from "@/types";
import { Copy, MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";

type TopicInfoProps = {
  tag: TagDetail;
  isFollowed?: boolean;
};

export const TopicInfo = ({
  tag,
  isFollowed: initialIsFollowed,
}: TopicInfoProps) => {
  const isMobile = useIsMobile();
  const scrolled = useScrollThreshold(isMobile ? 152 : 220, {
    enabled: true,
    hysteresis: isMobile ? 18 : 24,
  });
  const tButton = useTranslations("followButton");
  const t = useTranslations("topicInfo");
  const tAccountInfo = useTranslations("accountInfo");
  const locale = useLocale();
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed || false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, copyToClipboard] = useCopyToClipboard();

  const handleFollowToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isFollowed) {
        await tagControllerUnfollow({
          path: { id: tag.id.toString() },
        });
        setIsFollowed(false);
      } else {
        await tagControllerFollow({
          path: { id: tag.id.toString() },
        });
        setIsFollowed(true);
      }
    } catch (error) {
      console.error("Follow/unfollow tag failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTopicLink = async () => {
    if (typeof window === "undefined") {
      return;
    }

    await copyToClipboard(`${window.location.origin}/${locale}/topic/${tag.id}`);
  };

  const topicMenuItems: MenuItem[] = [
    {
      label: copied ? t("linkCopied") : t("copyLink"),
      icon: <Copy size={18} />,
      onClick: () => void handleCopyTopicLink(),
    },
  ];

  return (
    <div className="top-header sticky z-10 border-t border-t-border bg-card px-3 md:px-10">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 md:gap-4">
        <Avatar
          url={tag?.avatar || noTag}
          className={cn(
            "rounded-xl! transition-[width,height,top] duration-250 ease-out",
            !scrolled
              ? "size-11 -top-14 md:size-24 lg:size-29.5 md:-top-20"
              : "size-8",
          )}
        />

        <div className="relative h-full min-w-0 flex-1">
          <div
            className="flex h-full flex-1 items-center overflow-x-auto whitespace-nowrap transition-[opacity,transform] duration-250 ease-out [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              data-auto-translate-content
              className={cn(
                "mr-3 flex min-w-0 shrink-0 items-center transition-[opacity,transform] duration-250 ease-out",
                scrolled
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0",
              )}
            >
              <span className="truncate text-sm font-semibold text-foreground md:text-base">
                {tag.name}
              </span>
            </div>

            <div className="flex cursor-pointer items-center hover:text-primary">
              <span className="text-lg md:text-[22px]">
                {formatCompactNumber(tag?.articleCount, {
                  locale,
                  labels: compactNumberLabels,
                })}
              </span>
              <span className="ml-1 text-xs text-secondary md:text-sm">
                {t("posts")}
              </span>
              <span className="mx-2 text-[#eceff4] md:mx-3">/</span>
            </div>
            <div className="flex cursor-pointer items-center hover:text-primary">
              <span className="text-lg md:text-[22px]">
                {formatCompactNumber(tag.followCount, {
                  locale,
                  labels: compactNumberLabels,
                })}
              </span>
              <span className="ml-1 text-xs text-secondary md:text-sm">
                {t("members")}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "absolute -top-12 box-border flex h-12 w-full flex-col justify-center transition-[opacity,transform] duration-250 ease-out md:-top-19 md:h-19",
              scrolled
                ? "pointer-events-none -translate-y-2 opacity-0"
                : "translate-y-0 opacity-100",
            )}
          >
            <div
              data-auto-translate-content
              className="mb-0.5 flex items-center space-x-2 md:mb-1"
            >
              <span className="text-base text-white md:text-xl">{tag.name}</span>
            </div>
            <div
              data-auto-translate-content
              className="flex items-center space-x-1 text-[11px] text-white/80 md:text-xs"
            >
              <span className="line-clamp-1">{tag.description}</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative flex min-w-0 items-center gap-2 transition-transform duration-250 ease-out md:gap-3",
            !scrolled ? "-translate-y-12 md:-translate-y-14" : "",
          )}
        >
          <DropdownMenu
            title={t("menuTitle")}
            items={topicMenuItems}
            trigger={
              <button
                type="button"
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded-full text-white hover:text-primary md:size-9",
                  !scrolled ? "bg-[#000000a6]" : "bg-gray-50 text-foreground",
                )}
              >
                <MoreHorizontal size={18} />
              </button>
            }
            className="shrink-0"
            menuClassName="top-10"
          />
          <Button
            className={cn(
              "h-8 min-w-18 px-4 text-xs md:h-9 md:px-6 md:text-sm",
              "rounded-full",
              isFollowed
                ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                : "bg-[#e0e6ff] text-primary hover:bg-[#d0d9ff]",
            )}
            onClick={handleFollowToggle}
            disabled={isLoading}
          >
            <span className="text-xs">
              {isLoading
                ? "..."
                : isFollowed
                  ? tButton("following")
                  : tButton("follow")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
