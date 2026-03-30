"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { Link } from "@/i18n/routing";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useUserStore } from "@/stores";
import type { ArticleDetail } from "@/types";
import { useTranslations } from "next-intl";

type ArticleAuthorProps = {
  author: ArticleDetail["author"];
  createdAt: string;
  onFollow?: () => void;
};

export function ArticleAuthor({
  author,
  createdAt,
  onFollow,
}: ArticleAuthorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("time");
  const tFollow = useTranslations("followButton");
  const [stickyThreshold, setStickyThreshold] = useState<number | null>(null);
  const isSticky = useScrollThreshold(stickyThreshold ?? 0, {
    enabled: stickyThreshold !== null,
    hysteresis: 8,
  });
  const isSelf = useUserStore((state) => state.user)?.id === author.id || false;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateThreshold = () => {
      frameId = 0;

      const rootStyle = getComputedStyle(document.documentElement);
      const headerHeight = Number.parseFloat(
        rootStyle.getPropertyValue("--header-height"),
      );
      const stickyTopOffset = (Number.isFinite(headerHeight) ? headerHeight : 60) + 56;
      const rect = container.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const nextThreshold = Math.max(
        0,
        Math.round(absoluteTop - stickyTopOffset),
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
  }, []);

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
              !isSticky ? "size-12" : "size-8",
            )}
            url={author?.avatar}
            frameUrl={author?.equippedDecorations?.AVATAR_FRAME?.imageUrl || ""}
          />
        </Link>

        <div className="ml-3 flex min-w-0 flex-1 flex-col">
          <Link
            href={`/account/${author.id}`}
            className="flex items-center leading-5"
          >
            <span className="truncate font-bold hover:text-primary">
              {(author?.nickname || author?.username) as string}
            </span>
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
              {formatRelativeTime(createdAt, t)}
            </span>
          </div>
        </div>

        {!author?.isFollowed && !isSelf && (
          <div className="ml-3 flex w-auto items-center">
            <Button
              className="ml-2 min-w-18 rounded-full px-4 md:min-w-22 md:px-6"
              onClick={onFollow}
            >
              <span className="text-xs">{tFollow("follow")}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
