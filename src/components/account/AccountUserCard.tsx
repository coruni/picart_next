"use client";

import { GuardedLink } from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButtonWithStatus } from "@/components/ui/FollowButtonWithStatus";
import { cn } from "@/lib";
import { UserList } from "@/types";
import { useTranslations } from "next-intl";

type AccountUserCardProps = {
  user: UserList[number];
  border?: boolean;
};

export function AccountUserCard({ user, border }: AccountUserCardProps) {
  const t = useTranslations("userList");
  const displayName = user.nickname || user.username;
  const bio = user.description?.trim();

  return (
    <article>
      <GuardedLink
        href={`/account/${user.id}`}
        className={cn(
          "flex gap-3 rounded-xl p-4 transition-colors hover:bg-primary/5",
          border && "border-b border-border",
        )}
      >
        <Avatar
          url={user.avatar}
          frameUrl={user.equippedDecorations?.AVATAR_FRAME?.imageUrl}
          className="mt-1 size-12 shrink-0"
          alt={displayName}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-semibold text-foreground">
                  {displayName}
                </h2>
                <span className="truncate text-xs text-muted-foreground">
                  @{user.username}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">
                {bio || t("noBio")}
              </p>
            </div>

            <div data-guarded-link-ignore="true" className="shrink-0">
              <FollowButtonWithStatus author={user} className="min-w-20 px-4" />
            </div>
          </div>
        </div>
      </GuardedLink>
    </article>
  );
}
