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
import {
  buildAuthHeaders,
  DEVICE_ID_COOKIE_NAME,
  TOKEN_COOKIE_NAME,
} from "@/lib/request-auth";
import {
  generateSiteMetadata,
  getPublicCategories,
  getPublicConfig,
} from "@/lib/seo";
import { getServerCookie } from "@/lib/server-cookies";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { LocaleProvider } from "./LocaleProvider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  noStore();

  const { locale } = await params;

  if (!routing.locales.includes(locale as "zh" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const [initialToken, deviceId, requestHeaders] = await Promise.all([
    getServerCookie(TOKEN_COOKIE_NAME),
    getServerCookie(DEVICE_ID_COOKIE_NAME),
    buildAuthHeaders(),
  ]);
  const initialUser = initialToken ? await getCurrentUser() : null;
  const categories = await getPublicCategories();
  const config = await getPublicConfig();
  const hotSearchKeywords = await getHotSearchKeywordsSSR();
  void deviceId;
  void requestHeaders;

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
