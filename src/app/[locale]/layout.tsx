import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { NotificationContainer } from "@/components/NotificationContainer";
import { generateSiteMetadata } from "@/lib/seo";
import { DeviceFingerprintProvider } from "@/components/providers/DeviceFingerprintProvider";
import { UserStateProvider } from "@/components/providers/UserStateProvider";
import { getServerCookie } from "@/lib/server-cookies";
import { categoryControllerFindAll, configControllerGetPublicConfigs, userControllerGetProfile } from "@/api";
import { initializeInterceptors } from "@/rumtime.config";
import type { UserProfile } from "@/types";
import "../globals.css";

const TOKEN_COOKIE_NAME = "auth-token";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 动态生成元数据
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

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  // 获取服务端的 token，用于初始化客户端状态
  const initialToken = await getServerCookie(TOKEN_COOKIE_NAME);
  // 获取分类 
  const category = await categoryControllerFindAll({ query: { limit: 100 } })
  // 如果有 token，在服务端获取用户资料
  let initialUser: UserProfile | null = null;
  await initializeInterceptors();
  if (initialToken) {
    try {
      // 初始化拦截器，让它自动处理 Authorization 和 Device-Id
      const response = await userControllerGetProfile();
      initialUser = response?.data?.data || null;
    } catch (error) {
      // 如果获取失败，客户端会处理（可能是 token 过期）
    }
  }

  // 获取网站配置
  const { data } = await configControllerGetPublicConfigs();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {/* 设备指纹初始化 */}
          <DeviceFingerprintProvider />

          {/* 用户状态同步 */}
          <UserStateProvider initialToken={initialToken} initialUser={initialUser} initialConfig={data?.data!}>
            <Header categories={category.data?.data.data} />
            <div className="flex flex-col flex-1 min-h-screen">
              {children}
            </div>
            <NotificationContainer />
          </UserStateProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
