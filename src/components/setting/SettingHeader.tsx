"use client";

import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { settingMenuItems } from "./setting-menu-config";

export function SettingHeader() {
  const pathname = usePathname();
  const tHeader = useTranslations("header");

  const currentItem =
    settingMenuItems.find((item) =>
      item.href === "/setting"
        ? pathname === "/setting"
        : pathname.startsWith(item.href),
    ) || settingMenuItems[0];

  return <span className="font-semibold">{tHeader(currentItem.labelKey)}</span>;
}
