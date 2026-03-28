"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import type { ArticleDetail } from "@/types";
import { Link } from "@/i18n/routing";
import { useUserStore } from "@/stores";

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
  const [originalTop, setOriginalTop] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const t = useTranslations("time");
  const tFollow = useTranslations("followButton");
  const isSelf = useUserStore((state) => state.user)?.id === author.id || false;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollHandler: (() => void) | null = null;
    let resizeHandler: (() => void) | null = null;

    const updateOriginalPosition = () => {
      const rect = container.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const absoluteTop = scrollTop + rect.top;
      setOriginalTop(absoluteTop);
    };

    scrollHandler = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const stickyTop = 118;

      if (scrollTop >= originalTop - stickyTop) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    resizeHandler = updateOriginalPosition;

    const timer = setTimeout(() => {
      updateOriginalPosition();
      if (scrollHandler) {
        window.addEventListener("scroll", scrollHandler, { passive: true });
      }
      if (resizeHandler) {
        window.addEventListener("resize", resizeHandler);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
      }
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
      }
    };
  }, [originalTop]);

  return (
    <div
      ref={containerRef}
      className="h-12 px-6 flex items-center transition-all duration-200 sticky top-full z-10"
    >
      <div className="flex items-center flex-1 cursor-pointer mx-auto w-full">
        <Link href={`/account/${author.id}`} className="shrink-0">
          <Avatar
            className={cn(isSticky ? "size-8" : "size-12")}
            url={author?.avatar}
            frameUrl={author?.equippedDecorations?.AVATAR_FRAME?.imageUrl || ""}
          />
        </Link>
        <div className="ml-3 flex flex-col flex-1">
          <Link
            href={`/account/${author.id}`}
            className="flex items-center leading-5"
          >
            <span className="font-bold hover:text-primary">
              {(author?.nickname || author?.username) as string}
            </span>
          </Link>
          {!isSticky && (
            <div className="mt-1 leading-4">
              <span className="text-xs text-secondary">
                {formatRelativeTime(createdAt, t)}
              </span>
            </div>
          )}
        </div>

        {!author?.isFollowed && !isSelf && (
          <div className="ml-3 flex items-center w-auto">
            <Button className="ml-2 rounded-full px-6 min-w-22" onClick={onFollow}>
              <span className="text-xs">{tFollow("follow")}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
