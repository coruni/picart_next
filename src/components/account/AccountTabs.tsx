"use client";

import { NavigationTabs, TabItem } from "@/components/shared";
import { isAccountSectionHidden } from "@/lib/account-privacy";
import { UserDetail } from "@/types";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type AccountTabsProps = {
  user: UserDetail;
  viewerId?: string | null;
};

export function AccountTabs({ user, viewerId }: AccountTabsProps) {
  const params = useParams();
  const userId = params.id as string;
  const t = useTranslations("accountTabs");

  const tabs: TabItem[] = [
    { label: t("article"), value: "article", href: `/account/${userId}` },
  ];

  if (!isAccountSectionHidden(user, "comments", viewerId)) {
    tabs.push({
      label: t("comment"),
      value: "comment",
      href: `/account/${userId}/comment`,
    });
  }

  if (!isAccountSectionHidden(user, "favorites", viewerId)) {
    tabs.push({
      label: t("favorite"),
      value: "favorite",
      href: `/account/${userId}/favorite`,
    });
  }

  if (!isAccountSectionHidden(user, "tags", viewerId)) {
    tabs.push({
      label: t("tag"),
      value: "tag",
      href: `/account/${userId}/topic`,
    });
  }

  if (!isAccountSectionHidden(user, "collections", viewerId)) {
    tabs.push({
      label: t("collection"),
      value: "collection",
      href: `/account/${userId}/collection`,
    });
  }

  const isActive = (currentPath: string, tabHref: string) => {
    const normalizedPath = currentPath.replace(/^\/(zh|en)/, "");
    const normalizedHref = tabHref.replace(/^\/(zh|en)/, "");

    if (normalizedPath === normalizedHref) return true;

    if (
      normalizedHref.includes("/account/") &&
      !normalizedHref.endsWith(`/account/${userId}`)
    ) {
      return normalizedPath.startsWith(normalizedHref);
    }

    return false;
  };

  return <NavigationTabs tabs={tabs} isActive={isActive} />;
}
