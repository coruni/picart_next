"use client";

import { GuardedLink } from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButtonWithStatus } from "@/components/ui/FollowButtonWithStatus";
import { cn, formatCompactNumber } from "@/lib";
import { UserList } from "@/types";
import { useLocale, useTranslations } from "next-intl";

type SearchUserProps = {
  user: UserList[number];
  border?: boolean;
  keyword?: string;
};

function highlightText(text: string, keyword?: string) {
  const normalizedKeyword = keyword?.trim();
  if (!normalizedKeyword) return text;

  const regex = new RegExp(
    `(${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === normalizedKeyword.toLowerCase()) {
      return (
        <span key={index} className="text-primary">
          {part}
        </span>
      );
    }

    return part;
  });
}

export function SearchUser({ user, border, keyword }: SearchUserProps) {
  const t = useTranslations("userList");
  const tAccountInfo = useTranslations("accountInfo");
  const locale = useLocale();
  const displayName = user.nickname || user.username;
  const bio = user.description?.trim();
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

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
                <h2 className={cn("truncate font-semibold text-foreground", user?.isMember && "text-member")}>
                  {highlightText(displayName, keyword)}
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

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {formatCompactNumber(user.articleCount, {
                locale,
                labels: compactNumberLabels,
              })}{" "}
              {t("posts")}
            </span>
            <span>
              {formatCompactNumber(user.followerCount, {
                locale,
                labels: compactNumberLabels,
              })}{" "}
              {t("followers")}
            </span>
            <span>
              {formatCompactNumber(user.followingCount, {
                locale,
                labels: compactNumberLabels,
              })}{" "}
              {t("following")}
            </span>
          </div>
        </div>
      </GuardedLink>
    </article>
  );
}
