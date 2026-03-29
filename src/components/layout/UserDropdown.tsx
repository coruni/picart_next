"use client";

import { GuardedLink } from "@/components/shared/GuardedLink";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Switch } from "@/components/ui/Switch";
import { Link, routing, usePathname, useRouter } from "@/i18n/routing";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useAppStore, useModalStore, useUserStore } from "@/stores";
import {
  Check,
  ChevronRight,
  Globe,
  Lock,
  LogIn,
  MessageCircle,
  Monitor,
  Moon,
  Power,
  Sun,
  User,
  UserRoundX,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "../ui/Avatar";
import { UserLoginDialog } from "./UserLoginDialog";

export function UserDropdown() {
  const t = useTranslations("common");
  const tHeader = useTranslations("header");
  const tTheme = useTranslations("themeSwitcher");
  const tLanguage = useTranslations("languageSwitcher");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const modalStore = useModalStore();

  const themeOptions = [
    {
      value: "system" as const,
      label: tTheme("system"),
      icon: Monitor,
    },
    {
      value: "light" as const,
      label: tTheme("light"),
      icon: Sun,
    },
    {
      value: "dark" as const,
      label: tTheme("dark"),
      icon: Moon,
    },
  ];

  const languageOptions = routing.locales.map((value) => ({
    value,
    label: value === "zh" ? tLanguage("zh") : tLanguage("en"),
  }));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    window.location.reload();
  };

  const handleLoginDialogOpen = () => {
    modalStore.openModal(MODAL_IDS.LOGIN);
  };

  const handleLocaleChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      <div className="group relative">
        <div className="flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/20 transition-all hover:ring-2 hover:ring-primary">
          <Avatar
            bordered
            url={user?.avatar}
            frameUrl={user?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
            className="size-10"
          />
        </div>

        <div className="invisible absolute right-0 z-50 mt-2 min-w-90 rounded-xl border border-border bg-card opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
          {isAuthenticated && (
            <>
              <h3 className="px-3 py-4 text-lg font-bold text-foreground">
                {tHeader("authorInfo")}
              </h3>
              <div className="p-1">
                <Link
                  href={`/account/${user?.id}`}
                  className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center">
                      <User className="size-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {tHeader("personalPage")}
                    </span>
                  </div>
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              <div className="p-1">
                <GuardedLink
                  href="/profile/messages"
                  className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center">
                      <MessageCircle className="size-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {tHeader("messageManagement")}
                    </span>
                  </div>
                  <ChevronRight className="size-4" />
                </GuardedLink>
              </div>

              <div className="p-1">
                <GuardedLink
                  href="/profile/privacy"
                  className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center">
                      <Lock className="size-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {tHeader("privacySettings")}
                    </span>
                  </div>
                  <ChevronRight className="size-4" />
                </GuardedLink>
              </div>

              <div className="p-1">
                <GuardedLink
                  href="/profile/blocked-users"
                  className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center">
                      <UserRoundX className="size-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {tHeader("blockedUsers")}
                    </span>
                  </div>
                  <ChevronRight className="size-4" />
                </GuardedLink>
              </div>
            </>
          )}

          <h3 className="px-3 py-4 text-lg font-bold text-foreground">
            {tHeader("systemSettings")}
          </h3>

          <div className="group/language relative p-1">
            <div className="mb-1 flex h-10 cursor-pointer items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center justify-center">
                  <Globe className="size-5" />
                </div>
                <span className="text-sm font-medium">
                  {tHeader("switchLanguage")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {languageOptions.find((option) => option.value === locale)
                    ?.label || tHeader("currentLanguage")}
                </span>
                <ChevronRight className="size-4" />
              </div>
            </div>

            <div className="invisible absolute top-0 right-full z-10 mr-1 min-w-36 rounded-xl border border-border bg-card p-1 opacity-0 shadow-lg transition-all duration-150 group-hover/language:visible group-hover/language:opacity-100">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleLocaleChange(option.value)}
                  className="flex h-10 w-full cursor-pointer items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <Check
                    className={`size-4 ${
                      locale === option.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="group/theme relative p-1">
            <div className="mb-1 flex h-10 cursor-pointer items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center justify-center rounded-full">
                  <Moon className="size-5" />
                </div>
                <span className="text-sm font-medium">
                  {tHeader("appearanceSettings")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {themeOptions.find((option) => option.value === theme)
                    ?.label || tHeader("followSystem")}
                </span>
                <ChevronRight className="size-4" />
              </div>
            </div>

            <div className="invisible absolute top-0 right-full z-10 mr-1 min-w-40 rounded-xl border border-border bg-card p-1 opacity-0 shadow-lg transition-all duration-150 group-hover/theme:visible group-hover/theme:opacity-100">
              {themeOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className="flex h-10 w-full cursor-pointer items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-4" />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </div>
                    <Check
                      className={`size-4 ${
                        theme === option.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-1">
            <div className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center justify-center rounded-full">
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
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

          <div className="my-2 border-t border-border" />

          <div className="px-1 pb-2">
            {isAuthenticated ? (
              <button
                onClick={() => setLogoutDialogOpen(true)}
                className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
              >
                <Power className="size-5" />
                <span className="text-sm font-medium">{t("logout")}</span>
              </button>
            ) : (
              <button
                onClick={handleLoginDialogOpen}
                className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
              >
                <LogIn className="size-5" />
                <span className="text-sm font-medium">{t("login")}</span>
              </button>
            )}
          </div>
          <UserLoginDialog />
        </div>
      </div>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6" showClose={false}>
          <DialogHeader className="mb-0 space-y-2 text-center sm:text-center">
            <DialogTitle>{tHeader("logoutConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {tHeader("logoutConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-center gap-6! sm:justify-center">
            <Button
              variant="outline"
              className="h-8 rounded-full px-6"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={isLoggingOut}
            >
              {t("cancel")}
            </Button>
            <Button
              className="h-8 rounded-full px-6"
              onClick={handleLogout}
              loading={isLoggingOut}
              disabled={isLoggingOut}
            >
              {t("logout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
