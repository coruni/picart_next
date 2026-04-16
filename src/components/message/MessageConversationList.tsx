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
  isSwitchingTab: _isSwitchingTab,
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
  notificationPermission,
  notificationEnabled,
  onRequestNotificationPermission,
}: MessageConversationListProps) {
  const hasCachedMessages = filteredMessages.length > 0;
  const isInitialLoading = isLoading && !hasCachedMessages;
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
          {/* 通知开关按钮 */}
          {onRequestNotificationPermission && (
            <button
              type="button"
              onClick={onRequestNotificationPermission}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                notificationPermission === "granted" && notificationEnabled
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              title={notificationPermission === "granted" && notificationEnabled ? "点击关闭通知" : "点击开启通知"}
            >
              <Bell size={14} className={cn(notificationPermission === "granted" && notificationEnabled && "fill-current")} />
              <span>
                {notificationPermission === "granted"
                  ? notificationEnabled
                    ? "通知已开"
                    : "通知已关"
                  : "开启通知"}
              </span>
            </button>
          )}
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
                )}
                disabled={isInitialLoading}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div>
          {isInitialLoading ? (
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
                  {item.type === "private" && (
                    <div className="shrink-0">
                      <Avatar
                        url={item.avatarUrl}
                        className="size-10"
                        alt={item.title}
                      />
                    </div>
                  )}

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
