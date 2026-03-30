"use client";

import { userControllerFollow, userControllerUnfollow } from "@/api";
import { cn } from "@/lib";
import { useUserStore } from "@/stores/useUserStore";
import { ArticleDetail, ArticleList, UserList } from "@/types";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

type Author =
  | ArticleList[number]["author"]
  | ArticleDetail["author"]
  | UserList[number];

type FollowButtonWithStatusProps = {
  author: Author;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
  onFollowChange?: (isFollowed: boolean) => void;
};

export const FollowButtonWithStatus = ({
  author,
  size = "md",
  className,
  children,
  onFollowChange,
}: FollowButtonWithStatusProps) => {
  const t = useTranslations("followButton");
  const user = useUserStore((state) => state.user);
  const [isFollowed, setIsFollowed] = useState(author?.isFollowed || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  if (!author || user?.id === author.id) {
    return null;
  }

  if (isFollowed && !isAnimating && !isHiding) {
    return null;
  }

  const handleFollowToggle = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();

    if (isLoading || isAnimating) {
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowed) {
        await userControllerUnfollow({
          path: { id: author.id!.toString() },
        });
        setIsFollowed(false);
        onFollowChange?.(false);
      } else {
        await userControllerFollow({
          path: { id: author.id!.toString() },
        });
        setIsFollowed(true);
        setIsAnimating(true);
        onFollowChange?.(true);

        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        if (resetTimerRef.current) {
          clearTimeout(resetTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
          setIsHiding(true);
        }, 600);

        resetTimerRef.current = setTimeout(() => {
          setIsAnimating(false);
          setIsHiding(false);
        }, 1000);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={cn(
        "ml-2 rounded-full overflow-hidden transition-all duration-500 ease-in-out",
        isAnimating && !isHiding && "h-10! w-10! px-3!",
        isHiding && "translate-x-8 scale-0 opacity-0",
        !isAnimating && !isHiding && "px-6",
        className,
      )}
      onClick={handleFollowToggle}
      disabled={isLoading || isAnimating}
      loading={isLoading}
      size={size}
    >
      {children ? (
        children
      ) : (
        <div className="relative flex h-full w-full items-center justify-center">
          <span
            className={cn(
              "whitespace-nowrap text-xs transition-all duration-300",
              isAnimating && "scale-0 opacity-0",
            )}
          >
            {isLoading && !isAnimating
              ? "..."
              : isFollowed
                ? t("following")
                : t("follow")}
          </span>
          {isAnimating ? (
            <Check
              className={cn(
                "absolute size-4 transition-all duration-300",
                "animate-in fade-in-50 zoom-in-50",
              )}
            />
          ) : null}
        </div>
      )}
    </Button>
  );
};
