"use client";

import { useIsMobile } from "@/hooks";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores";
import { CategoryList } from "@/types";
import { useEffect, useRef } from "react";
import { HeaderTabs } from "../home/HeaderTabs";
import { CreateDropdown } from "./CreateDropdown";
import { MessageDropdown } from "./MessageDropdown";
import { SearchBox } from "./SearchBox";
import { UserDropdown } from "./UserDropdown";

type HeaderProps = {
  categories?: CategoryList;
};

export function Header({ categories }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const siteConfig = useAppStore((state) => state.siteConfig);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const allowedPages = ["/account/", "/topic/"];
  const deniedPages = ["/edit", "/decoration"];
  const isTransparentBgPage =
    allowedPages.some((path) => pathname.includes(path)) &&
    !deniedPages.some((path) => pathname.includes(path));
  const scrolled = useScrollThreshold(isMobile ? 168 : 220, {
    enabled: isTransparentBgPage,
    hysteresis: isMobile ? 16 : 24,
  });
  const shouldUseTransparentHeader = isTransparentBgPage && !scrolled;

  // 搜索页不显示搜索框，避免重复
  const isSearchPage =
    pathname === "/search" || pathname.startsWith("/search/");

  const actionButtonClassName = cn(
    "flex items-center justify-center rounded-full p-2 transition-colors",
    "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
    "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
    isTransparentBgPage && !scrolled && "text-white",
  );

  const renderActions = () => (
    <div className="flex items-center gap-4">
      <CreateDropdown />
      <MessageDropdown
        isTransparentBgPage={isTransparentBgPage}
        scrolled={scrolled}
      />
      <UserDropdown />
    </div>
  );

  const renderMobileActions = () => (
    <div className="flex items-center gap-2">
      <CreateDropdown actionButtonClassName={actionButtonClassName} />
      <MessageDropdown
        isTransparentBgPage={isTransparentBgPage}
        scrolled={scrolled}
      />
      <UserDropdown />
    </div>
  );

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return;

    const root = document.documentElement;
    const updateHeaderHeight = () => {
      root.style.setProperty(
        "--header-height",
        `${headerElement.offsetHeight}px`,
      );
    };

    updateHeaderHeight();

    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerElement);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-[background-color,color,box-shadow] duration-250 ease-out will-change-[background-color]",
        shouldUseTransparentHeader
          ? "bg-transparent dark:bg-transparent"
          : "bg-card",
      )}
      style={
        shouldUseTransparentHeader
          ? { backgroundColor: "transparent" }
          : undefined
      }
    >
      <div className="mx-auto px-4 md:px-10">
        <div className="flex min-h-15 flex-col justify-center gap-2 py-2 md:h-15 md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
          <div className="flex min-w-0 items-center justify-between gap-3 md:flex-none md:justify-start md:gap-4">
            <Link
              href="/"
              className={cn(
                "line-clamp-1 min-w-0 text-nowrap text-xl font-bold text-primary md:text-2xl",
                shouldUseTransparentHeader && "text-white",
              )}
            >
              {siteConfig?.site_name}
            </Link>
            <div className="hidden md:block">
              <HeaderTabs
                categories={categories ?? []}
                labelClassName={
                  shouldUseTransparentHeader ? "text-white" : undefined
                }
              />
            </div>

            <div className="shrink-0 md:hidden">{renderMobileActions()}</div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <HeaderTabs
              categories={categories ?? []}
              labelClassName={
                shouldUseTransparentHeader ? "text-white" : undefined
              }
            />
            {!isSearchPage && (
              <SearchBox
                categories={categories}
                isAccountPage={isTransparentBgPage}
                scrolled={scrolled}
                mobileVisible
                className="flex-1"
              />
            )}
          </div>

          {!isSearchPage && (
            <SearchBox
              categories={categories}
              isAccountPage={isTransparentBgPage}
              scrolled={scrolled}
            />
          )}

          <div className="hidden md:flex md:items-center md:gap-4">
            {renderActions()}
          </div>
        </div>
      </div>
    </header>
  );
}
