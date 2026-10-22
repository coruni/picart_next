import { AppChrome } from "@/components/layout/AppChrome.client";
import { UserAchievementDialog } from "@/components/layout/UserAchievementDialog";
import { UserAvatarFarmeDialog } from "@/components/layout/UserAvatarFarmeDialog";
import { UserCommentBubbleDialog } from "@/components/layout/UserCommentBubbleDialog";
import { AuthRouteGuard } from "@/components/providers/AuthRouteGuard";
import { ContentAutoTranslateProvider } from "@/components/providers/ContentAutoTranslateProvider";
import { DeviceFingerprintProvider } from "@/components/providers/DeviceFingerprintProvider";
import { HotSearchProvider } from "@/components/providers/HotSearchProvider";
import { ThemeSyncProvider } from "@/components/providers/ThemeSyncProvider";
import { UserStateProvider } from "@/components/providers/UserStateProvider";
import { routing } from "@/i18n/routing";
import { ToastContainer } from "@/lib";
import { getCurrentUser } from "@/lib/current-user";
import { getHotSearchKeywordsSSR } from "@/lib/hot-search-server";
import { TOKEN_COOKIE_NAME } from "@/lib/request-auth";
import {
  generateSiteMetadata,
  getPublicCategories,
  getPublicConfig,
} from "@/lib/seo";
import { getServerCookie } from "@/lib/server-cookies";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { LocaleProvider } from "./LocaleProvider";

// 布局读取 cookie 决定登录态，本身已是动态渲染；不再叠加 force-dynamic / noStore

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateSiteMetadata(locale);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "zh" | "en")) {
    notFound();
  }

  // 只依赖 url/cookie 的两项先并行；其余四项互不依赖，一起并行
  const [messages, initialToken] = await Promise.all([
    getMessages(),
    getServerCookie(TOKEN_COOKIE_NAME),
  ]);
  const [initialUser, categories, config, hotSearchKeywords] = await Promise.all([
    initialToken ? getCurrentUser() : Promise.resolve(null),
    getPublicCategories(),
    getPublicConfig(),
    getHotSearchKeywordsSSR(),
  ]);

  return (
    <>
      <NextTopLoader color="#6680ff" showSpinner={false} />
      <NextIntlClientProvider messages={messages}>
        <LocaleProvider />
        <DeviceFingerprintProvider />
        <ThemeSyncProvider />
        <ContentAutoTranslateProvider />

        <UserStateProvider
          initialToken={initialToken}
          initialUser={initialUser}
          initialConfig={config}
        >
          <AuthRouteGuard />
          <HotSearchProvider hotSearchKeywords={hotSearchKeywords}>
            <AppChrome categories={categories}>{children}</AppChrome>
          </HotSearchProvider>
          <UserAvatarFarmeDialog />
          <UserCommentBubbleDialog />
          <UserAchievementDialog />
        </UserStateProvider>
        <ToastContainer />
      </NextIntlClientProvider>
    </>
  );
}
