"use client";

import { EmptyState } from "@/components/shared";
import { GuardedLink } from "@/components/shared/GuardedLink";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useIsMobile } from "@/hooks";
import { cn, formatRelativeTime, formatShortDate } from "@/lib";
import { openLoginDialog } from "@/lib/modal-helpers";
import { resolveMessagePreviewText } from "@/components/message/MessageCenter.utils";
import { useMessageNotificationStore, useUserStore } from "@/stores";
import type { MessageTab } from "@/stores/useMessageNotificationStore";
import { BrushCleaning, MessageCircle, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const MIN_MOBILE_SHEET_HEIGHT = 12;
const MAX_MOBILE_SHEET_HEIGHT = 92;
const DEFAULT_MOBILE_SHEET_HEIGHT = 50;

function hasUnreadMessage(message: { isRead?: boolean; unreadCount?: number }) {
  return !message.isRead || Number(message.unreadCount || 0) > 0;
}

function getUnreadBadgeText(message: { unreadCount?: number }) {
  const count = Number(message.unreadCount || 0);
  return count > 0 ? String(count) : "•";
}

export function MessageDropdown({
  isTransparentBgPage,
  scrolled,
}: {
  isTransparentBgPage?: boolean;
  scrolled?: boolean;
}) {
  const tHeader = useTranslations("header");
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const tMsg = useTranslations("messageDropdown");
  const tTime = useTranslations("time");
  const locale = useLocale();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSheetHeight, setMobileSheetHeight] = useState(
    DEFAULT_MOBILE_SHEET_HEIGHT,
  );
  const [dropdownTab, setDropdownTab] = useState<MessageTab>("all");
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const token = useUserStore((state) => state.token);
  const messages = useMessageNotificationStore((state) => state.dropdownMessages);
  const unreadCount = useMessageNotificationStore((state) => state.unreadCount);
  const isLoading = useMessageNotificationStore((state) => state.dropdownIsLoading);
  const hasLoadedDropdownMessages = useMessageNotificationStore(
    (state) => state.hasLoadedDropdownMessages,
  );
  const dropdownLoadedTab = useMessageNotificationStore(
    (state) => state.dropdownLoadedTab,
  );
  const fetchDropdownMessages = useMessageNotificationStore(
    (state) => state.fetchDropdownMessages,
  );
  const fetchUnreadCount = useMessageNotificationStore(
    (state) => state.fetchUnreadCount,
  );
  const markAllAsRead = useMessageNotificationStore(
    (state) => state.markAllAsRead,
  );
  const initializeSocket = useMessageNotificationStore(
    (state) => state.initializeSocket,
  );
  const resetNotifications = useMessageNotificationStore(
    (state) => state.reset,
  );
  const dragStartYRef = useRef<number | null>(null);
  const dragStartHeightRef = useRef<number>(MIN_MOBILE_SHEET_HEIGHT);
  const mobileSheetHeightRef = useRef<number>(MIN_MOBILE_SHEET_HEIGHT);

  const tabs: Array<{ value: MessageTab; label: string }> = [
    { value: "all", label: tMsg("tabs.all") },
    { value: "notification", label: tMsg("tabs.notification") },
    { value: "private", label: tMsg("tabs.private") },
    { value: "system", label: tMsg("tabs.system") },
  ];
  const previewCopy = {
    emptyThread: tMsg("center.emptyThread"),
    imageOnlyPreview: tMsg("center.imageOnlyPreview"),
    recalledPreview: tMsg("center.recalledPreview"),
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      resetNotifications();
      return;
    }

    initializeSocket(token);
    void fetchUnreadCount();
  }, [
    fetchUnreadCount,
    initializeSocket,
    isAuthenticated,
    resetNotifications,
    token,
  ]);

  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      setMobileSheetHeight(DEFAULT_MOBILE_SHEET_HEIGHT);
    }
  }, [mobileOpen]);

  useEffect(() => {
    mobileSheetHeightRef.current = mobileSheetHeight;
  }, [mobileSheetHeight]);

  const filteredMessages = messages;
  const shouldFetchDropdownData =
    isAuthenticated &&
    !isLoading &&
    (!hasLoadedDropdownMessages || dropdownLoadedTab !== dropdownTab);

  const handleMouseEnter = () => {
    if (!isMobile && shouldFetchDropdownData) {
      void fetchDropdownMessages(dropdownTab);
    }
  };

  const handleTriggerClick = () => {
    if (!isMobile) {
      return;
    }

    setMobileOpen(true);

    if (shouldFetchDropdownData) {
      void fetchDropdownMessages(dropdownTab);
    }
  };

  const handleTabChange = (tab: MessageTab) => {
    if (tab === dropdownTab) return;

    setDropdownTab(tab);

    if (isAuthenticated) {
      void fetchDropdownMessages(tab);
    }
  };

  const handleCleanMessage = async () => {
    await markAllAsRead(dropdownTab);
  };

  const clampSheetHeight = (nextHeight: number) =>
    Math.min(
      Math.max(nextHeight, MIN_MOBILE_SHEET_HEIGHT),
      MAX_MOBILE_SHEET_HEIGHT,
    );

  const handleSheetDragMove = (clientY: number) => {
    if (dragStartYRef.current === null || typeof window === "undefined") {
      return;
    }

    const deltaY = dragStartYRef.current - clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    setMobileSheetHeight(
      clampSheetHeight(dragStartHeightRef.current + deltaVh),
    );
  };

  const handleSheetDragEnd = () => {
    if (mobileSheetHeightRef.current <= MIN_MOBILE_SHEET_HEIGHT) {
      setMobileOpen(false);
    }
    dragStartYRef.current = null;
  };

  const handleSheetPointerDown = (clientY: number) => {
    dragStartYRef.current = clientY;
    dragStartHeightRef.current = mobileSheetHeight;

    const handlePointerMove = (event: PointerEvent) => {
      handleSheetDragMove(event.clientY);
    };

    const handlePointerUp = () => {
      handleSheetDragEnd();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const renderListContent = (mobile = false) => {
    if (!isAuthenticated) {
      return (
        <EmptyState
          message={tSidebar("loginPrompt")}
          buttonText={tSidebar("login")}
          customButton={
            <Button
              className="rounded-full"
              onClick={() => {
                setMobileOpen(false);
                openLoginDialog();
              }}
            >
              {tSidebar("login")}
            </Button>
          }
        />
      );
    }

    return (
      <div
        className={cn(
          "px-3 py-2",
          mobile
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "max-h-96 overflow-y-auto",
        )}
        style={
          mobile
            ? { maxHeight: `calc(${mobileSheetHeight}vh - 104px)` }
            : undefined
        }
      >
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {tCommon("loading")}
          </div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((message) => {
            const previewText = resolveMessagePreviewText(message, previewCopy);

            return (
              <GuardedLink
                key={message.id}
                href={message.href}
                onClick={() => mobile && setMobileOpen(false)}
                className={cn(
                  "mb-1.5 flex items-start gap-3 rounded-md px-3 py-3 text-left transition-all",
                  hasUnreadMessage(message)
                    ? "bg-primary/8 hover:bg-primary/12"
                    : "hover:bg-muted/60",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    url={message.avatarUrl}
                    className="size-10"
                    alt={message.title}
                  />
                  {hasUnreadMessage(message) ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
                      {getUnreadBadgeText(message)}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate font-semibold text-foreground">
                      {message.title || tMsg("untitled")}
                    </p>
                    <span className="shrink-0 text-xs text-secondary">
                      {formatShortDate(message.createdAt || "", locale) ||
                        formatRelativeTime(message.createdAt || "", tTime, locale)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {previewText}
                  </p>
                </div>
              </GuardedLink>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {tMsg("noMessages")}
          </div>
        )}
      </div>
    );
  };

  const renderPanel = (mobile = false) => (
    <div className={cn(mobile && "flex h-full min-h-0 flex-col")}>
      <div className="flex shrink-0 items-center justify-between border-b border-border p-4 pt-5">
        <h3 className="flex-1 font-semibold text-foreground">
          {tHeader("messages")}
        </h3>
        {isAuthenticated && (
          <div className="flex items-center gap-6 text-secondary">
            <button
              className="cursor-pointer"
              onClick={handleCleanMessage}
              title={tMsg("cleanMessages")}
            >
              <BrushCleaning size={18} />
            </button>
            <GuardedLink
              href="/setting/notification"
              title={tMsg("notificationSettings")}
              onClick={() => mobile && setMobileOpen(false)}
            >
              <Settings size={18} />
            </GuardedLink>
          </div>
        )}
      </div>
      <div className="shrink-0 border-b border-border bg-card/95 px-4 backdrop-blur">
        <div className="flex items-center gap-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative shrink-0 min-w-12 cursor-pointer px-1 pb-3 pt-3 text-sm font-medium transition-colors",
                dropdownTab === tab.value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {dropdownTab === tab.value && (
                <span className="absolute bottom-0 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
      {renderListContent(mobile)}
    </div>
  );

  return (
    <>
      <div className="group relative" onMouseEnter={handleMouseEnter}>
        <button
          type="button"
          onClick={handleTriggerClick}
          className={cn(
            "relative flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100",
            "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
            isTransparentBgPage && !scrolled && "text-white",
          )}
        >
          <MessageCircle className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-2 items-center justify-center">
              <span className="absolute size-3 rounded-full bg-red-400/40 animate-ping [animation-duration:2s]" />
              <span className="relative block size-2 rounded-full bg-red-400" />
            </span>
          )}
        </button>

        {!isMobile && (
          <div className="invisible absolute right-0 z-50 w-full min-w-lg pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {renderPanel()}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isMobile && mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          className="top-auto bottom-0 left-0 right-0 max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-0 animate-in slide-in-from-bottom duration-300 ease-out md:hidden"
          style={
            {
              height: `${mobileSheetHeight}vh`,
              maxHeight: "88vh",
              willChange: "height",
            } as CSSProperties
          }
        >
          <div
            className="flex touch-none justify-center py-2"
            onPointerDown={(e) => handleSheetPointerDown(e.clientY)}
          >
            <span className="h-1.5 w-12 rounded-full bg-border" />
          </div>
          {renderPanel(true)}
        </DialogContent>
      </Dialog>
    </>
  );
}
