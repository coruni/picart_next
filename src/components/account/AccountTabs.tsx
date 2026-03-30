"use client";

import { NavigationTabs, TabItem } from "@/components/shared";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function AccountTabs() {
  const params = useParams();
  const userId = params.id as string;
  const t = useTranslations("accountTabs");

  const tabs: TabItem[] = [
    { label: t("article"), value: "article", href: `/account/${userId}` },
    {
      label: t("comment"),
      value: "comment",
      href: `/account/${userId}/comment`,
    },
    {
      label: t("favorite"),
      value: "favorite",
      href: `/account/${userId}/favorite`,
    },
    { label: t("tag"), value: "tag", href: `/account/${userId}/tag` },
  ];

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
