"use client";

import { useEffect, useState } from "react";
import { BrushCleaning, MessageCircle, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { messageControllerFindAll, messageControllerMarkAllAsRead } from "@/api";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { GuardedLink } from "@/components/shared/GuardedLink";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import { MessageList } from "@/types";
import { cn } from "@/lib";

export function MessageDropdown({
  isTransparentBgPage,
  scrolled,
}: {
  isTransparentBgPage?: boolean;
  scrolled?: boolean;
}) {
  const tHeader = useTranslations("header");
  const [messages, setMessages] = useState<MessageList>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page] = useState(1);
  const [limit] = useState(10);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    setMessages([]);
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    if (!isAuthenticated || isLoading) return;

    setIsLoading(true);
    try {
      const { data } = await messageControllerFindAll({
        query: {
          page,
          limit,
        },
      });
      setMessages(data?.data.data || []);
      setUnreadCount(data?.data?.data?.length || 0);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (isAuthenticated && messages.length === 0) {
      void fetchMessages();
    }
  };

  const handleCleanMessage = async () => {
    await messageControllerMarkAllAsRead();
    await fetchMessages();
  };

  return (
    <div className="group relative" onMouseEnter={handleMouseEnter}>
      <div
        className={cn(
          "flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100",
          "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
          isTransparentBgPage && !scrolled && "text-white",
        )}
      >
        <MessageCircle className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error-500" />
        )}
      </div>

      <div className="invisible absolute right-0 z-50 mt-2 w-full min-w-lg rounded-xl border border-border bg-card opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="flex items-center justify-between p-4">
          <h3 className="flex-1 font-semibold text-foreground">
            {tHeader("messages")}
          </h3>
          {isAuthenticated && (
            <div className="flex items-center gap-6 text-secondary">
              <button
                className="cursor-pointer"
                onClick={handleCleanMessage}
                title="清空消息"
              >
                <BrushCleaning size={18} />
              </button>
              <GuardedLink href="/setting/notification" title="通知设置">
                <Settings size={18} />
              </GuardedLink>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  加载中...
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <GuardedLink
                    key={message.id}
                    href={`/messages/${message.id}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {message.id}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-foreground">
                          {message.id}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {message.createdAt}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {message.content}
                      </p>
                    </div>
                  </GuardedLink>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无消息
                </div>
              )}
            </div>
            <div className="border-t border-border p-3">
              <GuardedLink
                href="/messages"
                className="block text-center text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {tHeader("viewAllMessages")}
              </GuardedLink>
            </div>
          </>
        ) : (
          <EmptyState
            message="登录查看更多精彩内容"
            buttonText="去登录"
            customButton={
              <Button className="rounded-full" onClick={openLoginDialog}>
                去登录
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
