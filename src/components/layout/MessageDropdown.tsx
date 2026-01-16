
"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUserStore } from "@/stores";
import { Button } from "@/components/ui/Button";
import { MessageList } from "@/types";
import { messageControllerFindAll } from "@/api";
export function MessageDropdown() {
    const tHeader = useTranslations("header");
    const [isHydrated, setIsHydrated] = useState(false);
    const [messages, setMessages] = useState<MessageList>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    
    // 使用 selector 获取响应式状态
    const isAuthenticated = useUserStore((state) => state.isAuthenticated);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // 获取消息列表
    const fetchMessages = async () => {
        if (!isAuthenticated || isLoading) return;

        setIsLoading(true);
        try {
            // TODO: 调用 API 获取消息列表
            const { data } = await messageControllerFindAll({
                query: {
                    page,
                    limit
                }
            })
            setMessages(data?.data.data || []);
            setUnreadCount(data?.data?.data?.length || 0);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 鼠标悬停时加载数据
    const handleMouseEnter = () => {
        if (isAuthenticated && messages.length === 0) {
            fetchMessages();
        }
    };

    return (
        <div className="relative group" onMouseEnter={handleMouseEnter}>
            <div className="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <MessageCircle className="size-5" />
                {/* 未读消息徽章 */}
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full"></span>
                )}
            </div>

            {/* Hover 面板 */}
            <div className="absolute right-0 mt-2 min-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4">
                    <h3 className="font-semibold text-foreground">{tHeader("messages")}</h3>
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
                                    <Link
                                        key={message.id}
                                        href={`/messages/${message.id}`}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
                                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                                {message.id}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {message.id}
                                                </p>
                                                <span className="text-xs text-muted-foreground">{message.time}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    暂无消息
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-border">
                            <Link
                                href="/messages"
                                className="block text-center text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                            >
                                {tHeader("viewAllMessages")}
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col pb-12">
                        {/* 空白占位图 */}
                        <div className="flex items-center justify-center flex-col gap-2">
                            <Image
                                src="/placeholder/empty.png"
                                width={200}
                                height={150}
                                alt="message-empty"
                                loading="eager"
                                style={{ height: 150, width: 200 }}
                                draggable={false}
                                className=" object-cover"
                            />
                            <span className="text-sm mb-2 text-secondary">登录查看更多精彩内容</span>
                        </div>
                        <div className="flex justify-center items-center">
                            <Link href="/login">
                                <Button variant="default" className="rounded-full" size="md">
                                    去登录
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
