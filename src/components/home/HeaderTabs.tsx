"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CategoryList } from "@/types";

interface TabItem {
  label: string;
  value: string;
  href: string;
  hasDropdown?: boolean;
}

type HeaderTabsProps = {
  categories: CategoryList;
  labelClassName?: string;
};

function isTabActive(currentPath: string, tabHref: string): boolean {
  if (tabHref === "/") {
    return currentPath === "/";
  }

  return currentPath.startsWith(tabHref);
}

const LAST_CHANNEL_KEY = "last-visited-channel";

export function HeaderTabs({ categories, labelClassName }: HeaderTabsProps) {
  const channels = categories.filter((category) => !category.link);
  const t = useTranslations("headerTabs");
  const pathname = usePathname();
  const currentPath = pathname.replace(/^\/(zh|en)/, "") || "/";

  useEffect(() => {
    if (currentPath.startsWith("/channel/") && currentPath !== "/channel") {
      try {
        sessionStorage.setItem(LAST_CHANNEL_KEY, currentPath);
      } catch (error) {
        console.error("Failed to save last channel:", error);
      }
    }
  }, [currentPath]);

  const getChannelHref = () => {
    if (typeof window === "undefined") return "/channel";

    try {
      return sessionStorage.getItem(LAST_CHANNEL_KEY) || "/channel";
    } catch {
      return "/channel";
    }
  };

  const tabs: TabItem[] = [
    { label: t("home"), value: "home", href: "/" },
    {
      label: t("channels"),
      value: "channels",
      href: getChannelHref(),
      hasDropdown: true,
    },
  ];

  return (
    <div className="relative flex min-w-0 items-center md:inline-flex">
      <div className="inline-flex w-full min-w-0 items-center gap-4 overflow-x-auto overflow-y-hidden px-1 py-1 scrollbar-none md:w-auto md:gap-6 md:overflow-visible md:px-4 md:py-2">
        {tabs.map((tab) => {
          const isActive = isTabActive(currentPath, tab.href);

          return (
            <div key={tab.value} className="group relative shrink-0">
              <Link
                href={tab.href}
                className={cn(
                  "relative flex h-full items-center gap-1 px-1 pb-2 text-sm font-semibold transition-colors hover:text-foreground group-hover:text-foreground md:text-base",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive ? "text-foreground" : "text-secondary",
                )}
              >
                <span className={cn("inline-flex items-center", labelClassName)}>
                  {tab.label}
                  {tab.hasDropdown && (
                    <ChevronDown
                      size={16}
                      className="hidden transition-transform group-hover:rotate-180 md:inline-flex"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-primary transition-opacity",
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                />
              </Link>

              {tab.hasDropdown && (
                <div className="absolute top-full left-0 z-50 mt-2 hidden w-80 rounded-xl bg-card opacity-0 shadow-lg invisible transition-all duration-200 group-hover:visible group-hover:opacity-100 md:block">
                  <div className="max-h-100 overflow-y-auto p-2">
                    <div className="grid gap-2">
                      {channels.map((channel) => {
                        const channelHref =
                          channel.children && channel.children.length > 0
                            ? `/channel/${channel.id}/${channel.children[0].id}`
                            : `/channel/${channel.id}`;

                        return (
                          <Link
                            key={channel.id}
                            href={channelHref}
                            className="flex h-10 items-center gap-3 rounded-lg p-1 px-2 transition-colors hover:bg-primary/15 hover:text-primary dark:hover:bg-gray-700"
                          >
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                              {channel.avatar ? (
                                <Image
                                  src={channel.avatar}
                                  alt={channel.name}
                                  width={32}
                                  height={32}
                                  loading="eager"
                                  sizes="32px"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="size-8 bg-primary/15" />
                              )}
                            </div>
                            <span className="text-sm font-medium">
                              {channel.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
