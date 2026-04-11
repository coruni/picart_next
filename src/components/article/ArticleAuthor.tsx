"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useIsMobile } from "@/hooks";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { Link } from "@/i18n/routing";
import { cn, formatRelativeTime, toDate } from "@/lib/utils";
import { useUserStore } from "@/stores";
import type { ArticleDetail } from "@/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";

type ArticleAuthorProps = {
  author: ArticleDetail["author"];
  createdAt: string;
  updatedAt?: string;
  onFollow?: () => void;
};

export function ArticleAuthor({
  author,
  createdAt,
  updatedAt,
  onFollow,
}: ArticleAuthorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("time");
  const locale = useLocale();
  const tFollow = useTranslations("followButton");
  const isMobile = useIsMobile();
  const hysteresis = isMobile ? 18 : 24;
  const [stickyThreshold, setStickyThreshold] = useState<number | null>(null);
  const isSticky = useScrollThreshold(stickyThreshold ?? 0, {
    enabled: stickyThreshold !== null,
    hysteresis,
  });
  const isSelf = useUserStore((state) => state.user)?.id === author.id || false;
  const createdDate = toDate(createdAt);
  const updatedDate = toDate(updatedAt);
  const isEdited = Boolean(
    createdDate &&
    updatedDate &&
    createdDate.getTime() !== updatedDate.getTime(),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateThreshold = () => {
      frameId = 0;

      const stickyHost = container.parentElement;
      const stickyHostTop = stickyHost
        ? Number.parseFloat(getComputedStyle(stickyHost).top)
        : Number.NaN;
      const rootHeaderHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height",
        ),
      );
      const stickyTopOffset = Number.isFinite(stickyHostTop)
        ? stickyHostTop
        : Number.isFinite(rootHeaderHeight)
          ? rootHeaderHeight + 56
          : 116;
      const rect = container.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const nextThreshold = Math.max(
        0,
        Math.round(absoluteTop - stickyTopOffset - hysteresis),
      );

      setStickyThreshold((previous) =>
        previous === nextThreshold ? previous : nextThreshold,
      );
    };

    const requestThresholdUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(updateThreshold);
    };

    requestThresholdUpdate();
    window.addEventListener("resize", requestThresholdUpdate, {
      passive: true,
    });
    window.addEventListener("load", requestThresholdUpdate);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(requestThresholdUpdate);
      resizeObserver.observe(container);
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", requestThresholdUpdate);
      window.removeEventListener("load", requestThresholdUpdate);
    };
  }, [hysteresis]);

  return (
    <div
      ref={containerRef}
      className="sticky top-full z-10 flex h-12 items-center px-4 md:px-6"
    >
      <div className="mx-auto flex w-full flex-1 cursor-pointer items-center">
        <Link href={`/account/${author.id}`} className="shrink-0">
          <Avatar
            className={cn(
              "transition-[width,height] duration-250 ease-out",
              !isSticky ? "size-10 md:size-12" : "size-8",
            )}
            url={author?.avatar}
            frameUrl={author?.equippedDecorations?.AVATAR_FRAME?.imageUrl || ""}
          />
        </Link>

        <div className="ml-3 flex min-w-0 flex-1 flex-col">
          <Link
            href={`/account/${author.id}`}
            className="flex items-center leading-5 space-x-1"
          >
            <span className="truncate font-bold hover:text-primary">
              {(author?.nickname || author?.username) as string}
            </span>
            {author?.equippedDecorations?.ACHIEVEMENT_BADGE && (
              <span className="relative size-4" data-auto-translate-conten>
                <ImageWithFallback
                  src={author?.equippedDecorations?.ACHIEVEMENT_BADGE?.imageUrl}
                  alt={author?.equippedDecorations?.ACHIEVEMENT_BADGE?.name}
                  title={author?.equippedDecorations?.ACHIEVEMENT_BADGE?.name}
                />
              </span>
            )}
          </Link>

          <div
            className={cn(
              "overflow-hidden transition-[max-height,opacity,transform] duration-250 ease-out",
              !isSticky
                ? "mt-1 max-h-6 translate-y-0 opacity-100"
                : "mt-0 max-h-0 -translate-y-1 opacity-0",
            )}
          >
            <span className="text-xs text-secondary">
              {formatRelativeTime(createdAt, t, locale)}
              {isEdited ? (
                <span className="ml-1">
                  ({locale.startsWith("zh") ? "已编辑" : "Edited"})
                </span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="ml-3 flex w-auto items-center">
          <FollowButtonWithStatus
            author={author}
            className="min-w-20 px-4"
            forceShow
          />
        </div>
      </div>
    </div>
  );
}
