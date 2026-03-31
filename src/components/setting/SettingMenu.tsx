"use client";

import { GuardedLink } from "@/components/shared";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { settingMenuItems } from "./setting-menu-config";

export function SettingMenu() {
  const pathname = usePathname();
  const tHeader = useTranslations("header");

  return (
    <div className="flex flex-col gap-3">
      {settingMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/setting"
            ? pathname === "/setting"
            : pathname.startsWith(item.href);
        const label = tHeader(item.labelKey);

        return (
          <GuardedLink
            key={item.href}
            href={item.href}
            aria-label={label}
            title={label}
            className={`flex items-center justify-center rounded-lg p-2 transition-colors md:justify-start md:gap-3 md:px-3 md:py-2 md:text-sm md:font-medium ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-gray-500 hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </GuardedLink>
        );
      })}
    </div>
  );
}
