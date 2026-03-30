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
import { useIsMobile } from "@/hooks";
import { Link, routing, usePathname, useRouter } from "@/i18n/routing";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useAppStore, useModalStore, useUserStore } from "@/stores";
import {
  Check,
  ChevronDown,
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
import { type ReactNode, useEffect, useState } from "react";
import { Avatar } from "../ui/Avatar";
import { UserLoginDialog } from "./UserLoginDialog";

export function UserDropdown() {
  const t = useTranslations("common");
  const tHeader = useTranslations("header");
  const tTheme = useTranslations("themeSwitcher");
  const tLanguage = useTranslations("languageSwitcher");
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
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
  const autoTranslateContent = useAppStore(
    (state) => state.autoTranslateContent,
  );
  const setAutoTranslateContent = useAppStore(
    (state) => state.setAutoTranslateContent,
  );
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
    setMobileMenuOpen(false);
    modalStore.openModal(MODAL_IDS.LOGIN);
  };

  const handleLocaleChange = (nextLocale: string) => {
    setMobileLanguageOpen(false);
    router.replace(pathname, { locale: nextLocale });
  };

  const handleThemeChange = (nextTheme: "light" | "dark" | "system") => {
    setTheme(nextTheme);
    setMobileThemeOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileLanguageOpen(false);
    setMobileThemeOpen(false);
  };

  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      closeMobileMenu();
    }
  }, [isMobile, mobileMenuOpen]);

  const renderMobileExpandableSection = (
    key: "language" | "theme",
    trigger: ReactNode,
    content: ReactNode,
  ) => {
    const isOpen = key === "language" ? mobileLanguageOpen : mobileThemeOpen;
    const setOpen =
      key === "language" ? setMobileLanguageOpen : setMobileThemeOpen;

    return (
      <div className="p-1">
        <button
          type="button"
          onClick={() => setOpen(!isOpen)}
          className="mb-1  cursor-pointer flex h-10 w-full items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
        >
          {trigger}
          <ChevronDown
            className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen ? (
          <div className="mt-1 rounded-xl border border-border bg-muted/40 p-1">
            {content}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <div className="group relative">
        <button
          type="button"
          onClick={() => isMobile && setMobileMenuOpen(true)}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/20 transition-all hover:ring-2 hover:ring-primary"
        >
          <Avatar
            bordered
            url={user?.avatar}
            frameUrl={user?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
            className="size-10"
          />
        </button>

        <div className="invisible absolute right-0 z-50 mt-2 hidden min-w-90 rounded-xl border border-border bg-card opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 md:block">
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
                    onClick={() => handleThemeChange(option.value)}
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

          <div className="p-1 cursor-pointer">
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
                checked={autoTranslateContent}
                onCheckedChange={setAutoTranslateContent}
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

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl p-0 md:hidden"
          showClose={false}
        >
          <div className="shrink-0 border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar
                bordered
                url={user?.avatar}
                frameUrl={user?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
                className="size-11"
              />
              <div className="min-w-0">
                <div className="font-semibold text-foreground">
                  {isAuthenticated
                    ? user?.nickname || user?.username
                    : t("login")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isAuthenticated
                    ? tHeader("authorInfo")
                    : tHeader("loginPrompt")}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {isAuthenticated && (
              <>
                <h3 className="px-2 py-3 text-base font-bold text-foreground">
                  {tHeader("authorInfo")}
                </h3>
                <div className="p-1">
                  <Link
                    href={`/account/${user?.id}`}
                    onClick={closeMobileMenu}
                    className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                  >
                    <div className="flex items-center gap-3">
                      <User className="size-5" />
                      <span className="text-sm font-medium">
                        {tHeader("personalPage")}
                      </span>
                    </div>
                    <ChevronRight className="size-4" />
                  </Link>
                  <GuardedLink
                    href="/profile/messages"
                    onClick={closeMobileMenu}
                    className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="size-5" />
                      <span className="text-sm font-medium">
                        {tHeader("messageManagement")}
                      </span>
                    </div>
                    <ChevronRight className="size-4" />
                  </GuardedLink>
                  <GuardedLink
                    href="/profile/privacy"
                    onClick={closeMobileMenu}
                    className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="size-5" />
                      <span className="text-sm font-medium">
                        {tHeader("privacySettings")}
                      </span>
                    </div>
                    <ChevronRight className="size-4" />
                  </GuardedLink>
                  <GuardedLink
                    href="/profile/blocked-users"
                    onClick={closeMobileMenu}
                    className="mb-1 flex h-10 items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                  >
                    <div className="flex items-center gap-3">
                      <UserRoundX className="size-5" />
                      <span className="text-sm font-medium">
                        {tHeader("blockedUsers")}
                      </span>
                    </div>
                    <ChevronRight className="size-4" />
                  </GuardedLink>
                </div>
              </>
            )}

            <h3 className="px-2 py-3 text-base font-bold text-foreground">
              {tHeader("systemSettings")}
            </h3>

            {renderMobileExpandableSection(
              "language",
              <div className="flex min-w-0 items-center gap-3">
                <Globe className="size-5 shrink-0" />
                <span className="text-sm font-medium">
                  {tHeader("switchLanguage")}
                </span>
                <span className="ml-auto truncate pr-2 text-sm text-muted-foreground">
                  {languageOptions.find((option) => option.value === locale)
                    ?.label || tHeader("currentLanguage")}
                </span>
              </div>,
              <>
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleLocaleChange(option.value)}
                    className="flex cursor-pointer h-10 w-full items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <Check
                      className={`size-4 ${
                        locale === option.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                ))}
              </>,
            )}

            {renderMobileExpandableSection(
              "theme",
              <div className="flex min-w-0 items-center gap-3">
                <Moon className="size-5 shrink-0" />
                <span className="text-sm font-medium">
                  {tHeader("appearanceSettings")}
                </span>
                <span className="ml-auto truncate pr-2 text-sm text-muted-foreground">
                  {themeOptions.find((option) => option.value === theme)
                    ?.label || tHeader("followSystem")}
                </span>
              </div>,
              <>
                {themeOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleThemeChange(option.value)}
                      className="flex cursor-pointer h-10 w-full items-center justify-between rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
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
              </>,
            )}

            <div className="p-1">
              <div className="mb-1  cursor-pointer flex h-10 items-center justify-between rounded-lg px-2 text-gray-500">
                <div className="flex items-center gap-3">
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
                  <span className="text-sm font-medium">
                    {tHeader("autoTranslate")}
                  </span>
                </div>
                <Switch
                  checked={autoTranslateContent}
                  onCheckedChange={setAutoTranslateContent}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border p-3">
            <div className="px-1">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLogoutDialogOpen(true);
                  }}
                  className="flex cursor-pointer h-10 w-full items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-primary/15 hover:text-primary"
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
          </div>
          <UserLoginDialog />
        </DialogContent>
      </Dialog>

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
