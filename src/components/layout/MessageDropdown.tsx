"use client";

import { messageControllerMarkAllAsRead, messageControllerSearch } from "@/api";
import { EmptyState } from "@/components/shared";
import { GuardedLink } from "@/components/shared/GuardedLink";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useIsMobile } from "@/hooks";
import { cn, formatRelativeTime, formatShortDate } from "@/lib";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import { MessageList } from "@/types";
import {
  BrushCleaning,
  ChevronRight,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type MessageTab = "all" | "notification" | "private" | "system";

const MIN_MOBILE_SHEET_HEIGHT = 12;
const MAX_MOBILE_SHEET_HEIGHT = 92;
const DEFAULT_MOBILE_SHEET_HEIGHT = 50;

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
  const [messages, setMessages] = useState<MessageList>([]);
  const [selectedTab, setSelectedTab] = useState<MessageTab>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSheetHeight, setMobileSheetHeight] = useState(
    DEFAULT_MOBILE_SHEET_HEIGHT,
  );
  const [page] = useState(1);
  const [limit] = useState(10);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartHeightRef = useRef<number>(MIN_MOBILE_SHEET_HEIGHT);
  const mobileSheetHeightRef = useRef<number>(MIN_MOBILE_SHEET_HEIGHT);

  const tabs: Array<{ value: MessageTab; label: string }> = [
    { value: "all", label: tMsg("tabs.all") },
    { value: "notification", label: tMsg("tabs.notification") },
    { value: "private", label: tMsg("tabs.private") },
    { value: "system", label: tMsg("tabs.system") },
  ];

  const messageTypeLabels: Record<Exclude<MessageTab, "all">, string> = {
    notification: tMsg("tabs.notification"),
    private: tMsg("tabs.private"),
    system: tMsg("tabs.system"),
  };

  useEffect(() => {
    setMessages([]);
    setSelectedTab("all");
  }, [isAuthenticated]);

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

  const fetchMessages = useCallback(
    async (tab: MessageTab = selectedTab) => {
      if (!isAuthenticated || isLoading) return;

      setIsLoading(true);
      try {
        const { data } = await messageControllerSearch({
          query: {
            page,
            limit,
            ...(tab !== "all" ? { type: tab } : {}),
          },
        });
        const nextMessages = data?.data.data || [];
        setMessages(nextMessages);
        setUnreadCount(
          nextMessages.filter((message) => !message.isRead).length,
        );
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, isLoading, limit, page, selectedTab],
  );

  const handleMouseEnter = () => {
    if (!isMobile && isAuthenticated && messages.length === 0) {
      void fetchMessages();
    }
  };

  const handleTriggerClick = () => {
    if (!isMobile) {
      return;
    }

    setMobileOpen(true);

    if (isAuthenticated && messages.length === 0) {
      void fetchMessages();
    }
  };

  const handleTabChange = (tab: MessageTab) => {
    if (tab === selectedTab) return;

    setSelectedTab(tab);

    if (isAuthenticated) {
      void fetchMessages(tab);
    }
  };

  const handleCleanMessage = async () => {
    await messageControllerMarkAllAsRead({
      body: selectedTab === "all" ? {} : { type: selectedTab },
    });
    await fetchMessages();
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
          "px-3 py-2 space-y-3",
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
          filteredMessages.map((message) => (
            <GuardedLink
              key={message.id}
              href={`/messages/${message.id}`}
              onClick={() => mobile && setMobileOpen(false)}
              className={cn(
                "group/message relative block border-b border-border transition-colors last-of-type:border-none",
                message.isRead ? "bg-card" : "bg-card hover:bg-primary/3",
              )}
            >
              {!message.isRead && (
                <span className="absolute right-4 top-4 h-3 w-3 rounded-full bg-red-500" />
              )}

              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium tracking-[0.02em] text-[#a9b7cc]">
                    {formatShortDate(message.createdAt || "", locale) ||
                      formatRelativeTime(message.createdAt || "", tTime, locale)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.type && message.type in messageTypeLabels
                      ? messageTypeLabels[
                          message.type as Exclude<MessageTab, "all">
                        ]
                      : tMsg("tabs.notification")}
                  </span>
                </div>

                <p className="pr-8 font-semibold text-foreground transition-colors group-hover/message:text-primary">
                  {message.title || tMsg("untitled")}
                </p>

                <p className="mt-3 text-[15px] text-foreground/78">
                  {message.content}
                </p>

                <div className="mt-2 pb-2 inline-flex items-center gap-1 text-base font-medium text-primary transition-colors">
                  <span>{tMsg("clickToJump")}</span>
                  <ChevronRight className="size-5" strokeWidth={3} />
                </div>
              </div>
            </GuardedLink>
          ))
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
      <div className="shrink-0 flex items-center justify-between border-b border-border p-4 pt-5">
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
                "relative shrink-0 min-w-12 pb-3 pt-3 px-1 text-sm font-medium transition-colors cursor-pointer",
                selectedTab === tab.value
                  ? "text-foreground"
                  : "text-secondary hover:text-foreground",
              )}
            >
              {tab.label}
              {selectedTab === tab.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary" />
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
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error-500" />
          )}
        </button>

        {!isMobile && (
          <div className="invisible absolute right-0 z-50 mt-2 w-full min-w-lg rounded-xl overflow-hidden border border-border bg-card opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
            {renderPanel()}
          </div>
        )}
      </div>

      <Dialog open={isMobile && mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          className="top-auto bottom-0 left-0 right-0 max-w-none overflow-hidden translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-0 animate-in slide-in-from-bottom duration-300 ease-out md:hidden"
          style={
            {
              height: `${mobileSheetHeight}vh`,
              maxHeight: "88vh",
              willChange: "height",
            } as CSSProperties
          }
        >
          <div
            className="flex justify-center py-2 touch-none"
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
