"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface TabItem {
    label: string;
    value: string;
    href: string;
}

const tabs: TabItem[] = [
    { label: "关注", value: "follow", href: "/follow" },
    { label: "推荐", value: "recommend", href: "/" },
    { label: "活动", value: "activity", href: "/activity" },
];

// 路径匹配规则
function isTabActive(currentPath: string, tabHref: string): boolean {
    if (tabHref === "/") {
        return currentPath === "/";
    }
    return currentPath.startsWith(tabHref);
}

export function FeedTabs() {
    const pathname = usePathname();

    // 移除 locale 前缀来匹配路径
    const currentPath = pathname.replace(/^\/(zh|en)/, "") || "/";

    return (
        <div className="inline-flex items-center gap-6">
            {tabs.map((tab) => {
                const isActive = isTabActive(currentPath, tab.href);

                return (
                    <Link
                        key={tab.value}
                        href={tab.href}
                        className={cn(
                            "relative px-1 pb-2 text-base font-medium transition-colors h-full ",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isActive
                                ? "text-foreground"
                                : "text-secondary hover:text-foreground"
                        )}
                    >
                        {tab.label}
                        {isActive && (
                            <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full w-5 translate-x-1/2" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
