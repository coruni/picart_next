"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useUserStore } from "@/stores";
import { ChevronRight, MessageCircle, PenIcon, Globe, Moon, LogIn } from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/Switch";
import { useState } from "react";
import { Button } from "../ui/Button";

export function Header() {
  const t = useTranslations("common");
  const tHeader = useTranslations("header");
  const { user, isAuthenticated } = useUserStore();
  const [autoTranslate, setAutoTranslate] = useState(false);

  return (
    <header className="sticky top-0 z-50  border-b border-border bg-white">
      <div className="px-10 mx-auto ">
        <div className="flex items-center justify-between gap-4 h-15">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary text-3xl font-bold">
              PICART
            </Link>
          </div>

          {/* 搜索框 */}
          <div className="flex-1  items-center justify-center hidden md:flex">
            <div className="relative group max-w-md h-9 w-full">
              <input
                type="text"
                placeholder={t("search")}
                className="w-full h-full pl-12 pr-4 border hover:ring-primary hover:ring-1 border-border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-4">
            {/* 用户菜单 */}
            <div className="flex items-center gap-4">
              {/* 创作按钮 */}
              <div className="relative group">
                <div className="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <PenIcon className="size-5" />
                </div>
                {/* Hover 面板 */}
                <div className="absolute right-0 mt-2 w-auto min-w-xs bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 space-y-2">
                    <Link
                      href="/create/post"
                      className="flex items-center gap-3 px-4 py-2 bg-[#F6F9FB] dark:bg-gray-700 hover:bg-[#EDF2F7] dark:hover:bg-gray-600 rounded-lg transition-colors group/item whitespace-nowrap"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                        <PenIcon className="size-5 text-green-600 dark:text-green-300" />
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{tHeader("create.article")}</span>
                      <ChevronRight className="size-4 text-gray-400 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-300 transition-colors" />
                    </Link>
                    <Link
                      href="/create/image"
                      className="flex items-center gap-3 px-4 py-3 bg-[#F6F9FB] dark:bg-gray-700 hover:bg-[#EDF2F7] dark:hover:bg-gray-600 rounded-lg transition-colors group/item whitespace-nowrap"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                        <svg className="size-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{tHeader("create.image")}</span>
                      <ChevronRight className="size-4 text-gray-400 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-300 transition-colors" />
                    </Link>
                    <Link
                      href="/create/video"
                      className="flex items-center gap-3 px-4 py-3 bg-[#F6F9FB] dark:bg-gray-700 hover:bg-[#EDF2F7] dark:hover:bg-gray-600 rounded-lg transition-colors group/item whitespace-nowrap"
                    >
                      <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0">
                        <svg className="size-5 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{tHeader("create.video")}</span>
                      <ChevronRight className="size-4 text-gray-400 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-300 transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 消息按钮 */}
              <div className="relative group">
                <div className="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <MessageCircle className="size-5" />
                  {/* 未读消息徽章 */}
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full"></span>
                </div>
                {/* Hover 面板 */}
                <div className="absolute right-0 mt-2 min-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 ">
                    <h3 className="font-semibold text-foreground">{tHeader("messages")}</h3>
                  </div>
                  {isAuthenticated ? (
                    <>
                      <div className="max-h-96 overflow-y-auto">
                        {/* 消息列表 */}
                        <Link
                          href="/messages/1"
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">A</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground truncate">用户名</p>
                              <span className="text-xs text-muted-foreground">2分钟前</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">这是一条消息内容...</p>
                          </div>
                        </Link>
                        <Link
                          href="/messages/2"
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">B</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground truncate">另一个用户</p>
                              <span className="text-xs text-muted-foreground">1小时前</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">另一条消息内容...</p>
                          </div>
                        </Link>
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
                    <>
                      <div className="flex flex-col pb-12">
                        {/* 空白占位图 */}
                        <div className="flex items-center justify-center flex-col gap-2">
                          <Image src="/placeholder/empty.png" width={200} height={150} alt="empty"></Image>
                          <span className=" text-foreground text-sm mb-2 text-secondary">登录查看更多精彩内容</span>
                        </div>
                        <div className="flex justify-center items-center">
                          <Button variant="default" className="rounded-full" size="md">
                            去登录
                          </Button>
                        </div>

                      </div>
                    </>
                  )}


                </div>
              </div>

              {/* 用户头像 */}
              <div className="relative group">
                <div className="flex items-center justify-center rounded-full cursor-pointer  bg-gray-200 hover:ring-2 hover:ring-primary transition-all">
                  {user?.avatar && typeof user.avatar === "string" ? (
                    <Image
                      src={user.avatar}
                      alt={user.username || "用户"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                      <span className="text-sm">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
                {/* Hover 面板 */}
                <div className="absolute right-0 mt-2 min-w-90 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {isAuthenticated ? (
                    <>
                      {/* 用户信息 */}
                      <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3 mb-3">
                          {user?.avatar && typeof user.avatar === "string" ? (
                            <Image
                              src={user.avatar}
                              alt={user.username || "用户"}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                              <span>{user?.username?.[0]?.toUpperCase() || "U"}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {user?.username || "用户"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email || ""}
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/profile"
                          className="block w-full px-4 py-2 text-sm text-center bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
                        >
                          {tHeader("viewProfile")}
                        </Link>
                      </div>
                      {/* 菜单项 */}
                      <div className="py-2">
                        <Link
                          href="/profile/settings"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <svg className="size-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-foreground">{tHeader("settings")}</span>
                        </Link>
                        <Link
                          href="/profile/favorites"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <svg className="size-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-sm text-foreground">{tHeader("favorites")}</span>
                        </Link>
                        <Link
                          href="/profile/wallet"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <svg className="size-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-sm text-foreground">{tHeader("wallet")}</span>
                        </Link>
                      </div>
                      {/* 退出登录 */}
                      <div className="p-2 border-t border-border">
                        <button
                          onClick={() => {
                            // 退出登录逻辑
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <svg className="size-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-sm text-foreground">{t("logout")}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 系统设置标题 */}
                      <h3 className="text-lg font-bold text-foreground px-3 py-4">
                        {tHeader("systemSettings")}
                      </h3>
                      <div className="p-1">
                        {/* 切换语言 */}
                        <Link
                          href="#"
                          className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center shrink-0">
                              <Globe className="size-5" />
                            </div>
                            <span className="text-sm font-medium ">
                              {tHeader("switchLanguage")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">简体中文</span>
                            <ChevronRight className="size-4 " />
                          </div>
                        </Link>
                      </div>

                      {/* 外观设置 */}
                      <div className="p-1">
                        <Link
                          href="#"
                          className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className=" rounded-full flex items-center justify-center shrink-0">
                              <Moon className="size-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">
                              {tHeader("appearanceSettings")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm ">{tHeader("followSystem")}</span>
                            <ChevronRight className="size-4 " />
                          </div>
                        </Link>
                      </div>


                      {/* 自动翻译推荐内容 */}
                      <div className="p-1">
                        <div className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full flex items-center justify-center shrink-0">
                              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium">
                              {tHeader("autoTranslate")}
                            </span>
                          </div>
                          <Switch
                            checked={autoTranslate}
                            onCheckedChange={setAutoTranslate}
                          />
                        </div>
                      </div>

                      {/* 分隔线 */}
                      <div className="border-t border-border my-2"></div>

                      {/* 登录按钮 */}
                      <div className="pb-2 px-1">
                        <Link
                          href="/login"
                          className="flex items-center text-gray-500  gap-2 px-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <LogIn className="size-5 " />
                          <span className="text-sm font-medium ">{t("login")}</span>
                        </Link>
                      </div>

                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header >
  );
}
