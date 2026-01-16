
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, Moon, ChevronRight, LogIn, Power, User, MessageCircle, Lock, UserRoundX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUserStore, useModalStore } from "@/stores";
import { Switch } from "@/components/ui/Switch";
import { MODAL_IDS, openLoginDialog } from "@/lib/modal-helpers";
import { UserLoginDialog } from "./UserLoginDialog";

export function UserDropdown() {
  const t = useTranslations("common");
  const tHeader = useTranslations("header");
  const [autoTranslate, setAutoTranslate] = useState(false);

  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  const modalStore = useModalStore();

  const handleLogout = async () => {
    logout();
    // 强制刷新页面，确保服务端重新渲染
    window.location.reload()
  };

  const handleLoginDialogOpen = () => {
    modalStore.openModal(MODAL_IDS.LOGIN);
  };



  return (
    <>
      <div className="relative group">
        <div className="flex items-center justify-center rounded-full cursor-pointer bg-gray-200 hover:ring-2 hover:ring-primary transition-all">
          {user?.avatar && typeof user.avatar === "string" ? (
            <Image
              src={user.avatar}
              alt={user.username || "用户"}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold" onClick={handleLoginDialogOpen}>
              <span className="text-sm">{user?.username?.[0]?.toUpperCase() || "U"}</span>
            </div>
          )}
        </div>

        {/* Hover 面板 */}
        <div className="absolute right-0 mt-2 min-w-90 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {/* 我的信息 - 仅登录后显示 */}
          {isAuthenticated && (
            <>
              <h3 className="text-lg font-bold text-foreground px-3 py-4">
                {tHeader("myInfo")}
              </h3>
              <div className="p-1">
                {/* 个人主页 */}
                <Link
                  href="/profile"
                  className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center shrink-0">
                      <User className="size-5" />
                    </div>
                    <span className="text-sm font-medium">{tHeader("personalPage")}</span>
                  </div>
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              {/* 信息管理 */}
              <div className="p-1">
                <Link
                  href="/profile/messages"
                  className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center shrink-0">
                      <MessageCircle className="size-5" />
                    </div>
                    <span className="text-sm font-medium">{tHeader("messageManagement")}</span>
                  </div>
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              {/* 隐私设置 */}
              <div className="p-1">
                <Link
                  href="/profile/privacy"
                  className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center shrink-0">
                      <Lock className="size-5" />
                    </div>
                    <span className="text-sm font-medium">{tHeader("privacySettings")}</span>
                  </div>
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              {/* 屏蔽用户管理 */}
              <div className="p-1">
                <Link
                  href="/profile/blocked-users"
                  className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center shrink-0">
                      <UserRoundX className="size-5" />
                    </div>
                    <span className="text-sm font-medium">{tHeader("blockedUsers")}</span>
                  </div>
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </>
          )}

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
                <span className="text-sm font-medium">{tHeader("switchLanguage")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">简体中文</span>
                <ChevronRight className="size-4" />
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
                <div className="rounded-full flex items-center justify-center shrink-0">
                  <Moon className="size-5" />
                </div>
                <span className="text-sm font-medium">{tHeader("appearanceSettings")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{tHeader("followSystem")}</span>
                <ChevronRight className="size-4" />
              </div>
            </Link>
          </div>

          {/* 自动翻译推荐内容 */}
          <div className="p-1">
            <div className="flex items-center h-10 justify-between px-2 text-gray-500 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors mb-1">
              <div className="flex items-center gap-3">
                <div className="rounded-full flex items-center justify-center shrink-0">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">{tHeader("autoTranslate")}</span>
              </div>
              <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-border my-2"></div>

          {/* 登录/退出按钮 */}
          <div className="pb-2 px-1">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center cursor-pointer text-gray-500 gap-2 px-2 h-10 w-full hover:bg-primary/20  hover:text-primary rounded-lg transition-colors"
              >
                <Power className="size-5" />
                <span className="text-sm font-medium">{t("logout")}</span>
              </button>
            ) : (
              <button
              onClick={openLoginDialog}
                className="flex items-center cursor-pointer  w-full text-gray-500 gap-2 px-2 h-10 hover:bg-primary/20 hover:text-primary  rounded-lg transition-colors"
              >
                <LogIn className="size-5" />
                <span className="text-sm font-medium">{t("login")}</span>
              </button>
            )}
          </div>
          <UserLoginDialog />
        </div>
      </div >

    </>
  );
}
