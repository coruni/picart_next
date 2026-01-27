"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CategoryList } from "@/types";
import { useEffect } from "react";

interface TabItem {
    label: string;
    value: string;
    href: string;
    hasDropdown?: boolean;
}

type HeaderTabsProps = {
    categories: CategoryList,
    labelClassName?: string;
}

// 路径匹配规则
function isTabActive(currentPath: string, tabHref: string): boolean {
    if (tabHref === "/") {
        return currentPath === "/";
    }
    return currentPath.startsWith(tabHref);
}

const LAST_CHANNEL_KEY = 'last-visited-channel';

export function HeaderTabs({ categories, labelClassName }: HeaderTabsProps) {
    const channels = categories.filter((category) => !category.link)
    const t = useTranslations('headerTabs');
    const pathname = usePathname();

    // 移除 locale 前缀来匹配路径
    const currentPath = pathname.replace(/^\/(zh|en)/, "") || "/";

    // 如果当前在 channel 页面，保存路径到 sessionStorage
    useEffect(() => {
        if (currentPath.startsWith('/channel/') && currentPath !== '/channel') {
            try {
                sessionStorage.setItem(LAST_CHANNEL_KEY, currentPath);
            } catch (e) {
                console.error('Failed to save last channel:', e);
            }
        }
    }, [currentPath]);

    // 获取最后访问的频道路径
    const getChannelHref = () => {
        if (typeof window === 'undefined') return '/channel';
        
        try {
            const lastChannel = sessionStorage.getItem(LAST_CHANNEL_KEY);
            return lastChannel || '/channel';
        } catch (e) {
            return '/channel';
        }
    };

    // 标签数据
    const tabs: TabItem[] = [
        { label: t('home'), value: "home", href: "/" },
        { label: t('channels'), value: "channels", href: getChannelHref(), hasDropdown: true },
    ];

    return (
        <div className="relative inline-flex items-center">
            <div className="inline-flex items-center gap-6 px-4 py-2">
                {tabs.map((tab) => {
                    const isActive = isTabActive(currentPath, tab.href);

                    return (
                        <div key={tab.value} className="relative group">
                            <Link
                                href={tab.href}
                                className={cn(
                                    "relative px-1 pb-2 text-base group-hover:text-foreground transition-colors h-full flex items-center gap-1 hover:text-foreground font-semibold",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    isActive
                                        ? "text-foreground"
                                        : "text-secondary"
                                )}
                            >
                                <span className={cn("inline-flex items-center", labelClassName)}>
                                    {tab.label}
                                    {tab.hasDropdown && <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />}
                                </span>
                                <span className={cn(
                                    'absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full w-5 transition-opacity',
                                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                )} />
                            </Link>

                            {/* 频道下拉面板 - 仅在 channels 标签上显示 */}
                            {tab.hasDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-card rounded-xl shadow-lg z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <div className="p-2">
                                        <div className="grid gap-2">
                                            {channels?.map((channel) => {
                                                // 如果有子频道，跳转到第一个子频道，否则跳转到主频道
                                                const channelHref = channel.children && channel.children.length > 0
                                                    ? `/channel/${channel.id}/${channel.children[0].id}`
                                                    : `/channel/${channel.id}`;
                                                
                                                return (
                                                    <Link
                                                        key={channel.id}
                                                        href={channelHref}
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/15 hover:text-primary  dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                                            {channel.avatar ? (
                                                                <Image
                                                                    src={channel.avatar}
                                                                    alt={channel.name}
                                                                    width={32}
                                                                    height={32}
                                                                    sizes="512px"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="size-8 bg-primary/15">
                                                                </div>
                                                            )}

                                                        </div>
                                                        <span className="text-sm font-medium ">
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