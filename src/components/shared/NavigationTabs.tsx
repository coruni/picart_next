"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  value: string;
  href: string;
}

interface NavigationTabsProps {
  tabs: TabItem[];
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  indicatorClassName?: string;
  /**
   * 自定义路径匹配逻辑
   * @param currentPath 当前路径（已移除 locale 前缀）
   * @param tabHref tab 的 href
   * @returns 是否激活
   */
  isActive?: (currentPath: string, tabHref: string) => boolean;
}

// 默认路径匹配规则
function defaultIsActive(currentPath: string, tabHref: string): boolean {
  if (tabHref === "/") {
    return currentPath === "/";
  }
  return currentPath.startsWith(tabHref);
}

export function NavigationTabs({
  tabs,
  className,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  indicatorClassName,
  isActive = defaultIsActive,
}: NavigationTabsProps) {
  const pathname = usePathname();

  // 移除 locale 前缀来匹配路径
  const currentPath = pathname.replace(/^\/(zh|en)/, "") || "/";

  return (
    <div className={cn("inline-flex items-center gap-6", className)}>
      {tabs.map((tab) => {
        const active = isActive(currentPath, tab.href);

        return (
          <Link
            key={tab.value}
            href={tab.href}
            className={cn(
              "relative px-1 py-2 text-base font-medium transition-colors h-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              tabClassName,
              active
                ? cn("text-foreground", activeTabClassName)
                : cn("text-secondary hover:text-foreground", inactiveTabClassName)
            )}
          >
            {tab.label}
            {active && (
              <span
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full w-5",
                  indicatorClassName
                )}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
