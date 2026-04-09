"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, formatRelativeTime, formatShortDate } from "@/lib";
import { prepareRichTextHtmlForSummary } from "@/lib/rich-text";
import {
  Bell,
  Inbox,
  MessageCircleMore,
  Search,
  Shield,
} from "lucide-react";
import { resolveMessagePreviewText } from "./MessageCenter.utils";
import type { MessageConversationListProps } from "./MessageCenter.types";

const tabIcons = {
  all: Inbox,
  notification: Bell,
  private: MessageCircleMore,
  system: Shield,
} as const;

export function MessageConversationList({
  copy,
  filteredMessages,
  isLoading,
  isSwitchingTab,
  isMobileDetailOpen,
  locale,
  onTabChange,
  search,
  selectedItemId,
  selectedTab,
  setSearch,
  onSelectItem,
  socketConnected: _socketConnected,
  tabs,
  tCommon,
  tMsg,
  tTime,
}: MessageConversationListProps) {
  const activeEmptyText = search.trim()
    ? copy.noResults
    : selectedTab === "private"
      ? copy.noConversation
      : copy.noMessages;

  return (
    <aside
      className={cn(
        "min-h-0 flex-col border-b border-border/70 bg-card md:flex md:border-b-0 md:border-r",
        isMobileDetailOpen ? "hidden" : "flex",
      )}
    >
      <div className="shrink-0 border-b border-border/70 bg-card px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className=" font-semibold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{copy.subtitle}</p>
          </div>
          {/* <div className="rounded-2xl border border-border/70 bg-muted/40 px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {copy.realtime}
            </div>
            <div
              className={cn(
                "mt-1 text-sm font-semibold",
                socketConnected ? "text-primary" : "text-muted-foreground",
              )}
            >
              {socketConnected ? "Online" : "Offline"}
            </div>
          </div> */}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-11 rounded-full border-border/70 bg-muted/45 pl-9"
            fullWidth
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tabIcons[tab.value as keyof typeof tabIcons];
            const active = selectedTab === tab.value;

            return (
              <Button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                variant={active ? "primary" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-full px-3 transition-all duration-200",
                  active
                    ? "shadow-none"
                    : "border border-border/70 bg-background",
                  isSwitchingTab && active && "opacity-80",
                )}
                disabled={isSwitchingTab}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
                {isSwitchingTab && active && (
                  <span className="ml-1.5 inline-block size-3 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {/* Tab 切换加载指示器 */}
        {isSwitchingTab && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center py-2">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <span className="inline-block size-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              {tCommon("loading")}
            </div>
          </div>
        )}

        {/* 内容区域 - tab 切换时保留旧数据 */}
        <div>
          {isLoading && !isSwitchingTab ? (
            <div className="px-4 py-10 text-sm text-muted-foreground">
              {tCommon("loading")}
            </div>
          ) : isSwitchingTab ? (
            <div className="px-4 py-10 text-sm text-muted-foreground">
              {tCommon("loading")}
            </div>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((item) => {
              const active = selectedItemId === item.id;
              const previewText = resolveMessagePreviewText(item, copy);
              const hasUnread =
                !item.isRead || Number(item.unreadCount || 0) > 0;

              return (
                <Button
                  key={`${item.type}-${item.id}`}
                  onClick={() => onSelectItem(item.id, item.href)}
                  variant="ghost"
                  className={cn(
                    "mb-1.5 flex h-auto w-full items-start justify-start gap-3 rounded-md px-3 py-3 text-left transition-all",
                    active && "bg-primary/15",
                  )}
                >
                  <div className="shrink-0">
                    <Avatar
                      url={item.avatarUrl}
                      className="size-10"
                      alt={item.title}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "flex min-w-0 items-center gap-2",
                          active ? "text-primary-foreground" : "text-foreground",
                        )}
                      >
                        {hasUnread ? (
                          <span className="size-2 shrink-0 rounded-full bg-red-400" />
                        ) : null}
                        <p className="truncate font-semibold">
                          {item.title || tMsg("untitled")}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-secondary">
                        {formatShortDate(item.createdAt || "", locale) ||
                          formatRelativeTime(item.createdAt || "", tTime, locale)}
                      </span>
                    </div>
                    <div
                      className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: prepareRichTextHtmlForSummary(previewText),
                      }}
                    />
                  </div>
                </Button>
              );
            })
          ) : (
            <div className="px-4 py-10 text-sm text-muted-foreground">
              {activeEmptyText}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
