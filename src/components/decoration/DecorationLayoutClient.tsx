"use client";

import { ReactNode } from "react";
import { GuardedLink } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";

import avatarFrameSvg from "@/assets/images/account/decoration/avatar_frame.svg";
import avatarFrameActiveSvg from "@/assets/images/account/decoration/avatar_frame_active.svg";
import commentSvg from "@/assets/images/account/decoration/comment.svg";
import commentActiveSvg from "@/assets/images/account/decoration/comment_active.svg";
import emojiSvg from "@/assets/images/account/decoration/emoji.svg";
import emojiActiveSvg from "@/assets/images/account/decoration/emoji_active.svg";

interface DecorationLayoutClientProps {
  locale: string;
  userId: string;
  children: ReactNode;
}

export function DecorationLayoutClient({
  locale: _locale,
  userId,
  children,
}: DecorationLayoutClientProps) {
  const t = useTranslations("decorationPage");
  const pathname = usePathname();

  // 从 pathname 判断当前激活的类型
  // /account/[id]/decoration                => 默认 avatar-frame
  // /account/[id]/decoration/emoji          => emoji
  // /account/[id]/decoration/comment        => comment
  const isEmojiPage = pathname.includes("/decoration/emoji");
  const isCommentPage = pathname.includes("/decoration/comment");
  const currentDecorationType = isEmojiPage
    ? "emoji"
    : isCommentPage
      ? "comment"
      : "avatar-frame";

  const decorationTypes = [
    {
      id: "avatar-frame",
      translationKey: "avatarFrame",
      icon: avatarFrameSvg,
      iconActive: avatarFrameActiveSvg,
      href: `/account/${userId}/decoration`,
    },
    {
      id: "emoji",
      translationKey: "emoji",
      icon: emojiSvg,
      iconActive: emojiActiveSvg,
      href: `/account/${userId}/decoration/emoji`,
    },
    {
      id: "comment",
      translationKey: "commentBubble",
      icon: commentSvg,
      iconActive: commentActiveSvg,
      href: `/account/${userId}/decoration/comment`,
    },
  ] as const;

  return (
    <div className="mx-auto flex max-w-4xl flex-1 flex-col rounded-xl bg-card">
      {/* 标题栏 */}
      <div className="flex h-14 items-center border-b border-border px-6">
        <div className="flex h-full flex-1 items-center">
          <span className="pr-6 text-base font-bold">{t("title")}</span>
        </div>
      </div>

      <div className="flex flex-1">
        {/* 侧边栏 */}
        <div
          className="flex w-full max-w-30 flex-col space-y-3 overflow-y-scroll border-r border-border p-4"
          style={{ scrollbarWidth: "none" }}
        >
          {decorationTypes.map(
            ({ id, translationKey, icon, iconActive, href }) => {
              const isActive = currentDecorationType === id;

              return (
                <GuardedLink
                  key={id}
                  href={href}
                  className={cn(
                    "group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl p-2",
                    isActive ? "bg-primary/20" : "hover:bg-primary/20",
                  )}
                >
                  <div className="relative size-16">
                    <Image
                      src={icon}
                      alt={id}
                      fill
                      className={cn(
                        "absolute inset-0 h-full w-full",
                        isActive ? "hidden" : "group-hover:hidden",
                      )}
                    />
                    <Image
                      src={iconActive}
                      alt={id}
                      fill
                      className={cn(
                        "absolute inset-0 h-full w-full",
                        isActive ? "block" : "hidden group-hover:block",
                      )}
                    />
                  </div>
                  <span className="text-xs">
                    {t(`types.${translationKey}`)}
                  </span>
                </GuardedLink>
              );
            },
          )}
        </div>

        {/* 内容区 */}
        <div className="h-full flex-1 px-4 pt-6">{children}</div>
      </div>
    </div>
  );
}
