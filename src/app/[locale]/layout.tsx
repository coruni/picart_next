import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { NotificationContainer } from "@/components/shared";
import { generateSiteMetadata } from "@/lib/seo";
import { DeviceFingerprintProvider } from "@/components/providers/DeviceFingerprintProvider";
import { UserStateProvider } from "@/components/providers/UserStateProvider";
import { getServerCookie, setServerCookie } from "@/lib/server-cookies";
import NextTopLoader from "nextjs-toploader";
import {
  categoryControllerFindAll,
  configControllerGetPublicConfigs,
  userControllerGetProfile,
} from "@/api";
import type { UserProfile } from "@/types";

const TOKEN_COOKIE_NAME = "auth-token";
const DEVICE_ID_COOKIE_NAME = "device_fingerprint";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

  const messages = await getMessages();
  const initialToken = await getServerCookie(TOKEN_COOKIE_NAME);

  let deviceId = await getServerCookie(DEVICE_ID_COOKIE_NAME);
  if (!deviceId) {
    deviceId = generateUUID();
    await setServerCookie(DEVICE_ID_COOKIE_NAME, deviceId, {
      maxAge: 60 * 60 * 24 * 365 * 10,
      path: "/",
      sameSite: "lax",
    });
  }

  const requestHeaders = new Headers();
  if (initialToken) {
    requestHeaders.set("Authorization", `Bearer ${initialToken}`);
  }
  if (deviceId) {
    requestHeaders.set("Device-Id", deviceId);
  }

  const category = await categoryControllerFindAll({
    query: { limit: 100 },
    cache: "no-store",
    headers: requestHeaders,
  });
  const { data } = await configControllerGetPublicConfigs({
    headers: requestHeaders,
  });
  const config = data?.data ?? null;
  let initialUser: UserProfile | null = null;

  if (initialToken) {
    try {
      const response = await userControllerGetProfile({
        headers: requestHeaders,
      });
      initialUser = response?.data?.data || null;
    } catch {
      // Ignore auth fetch failure here; client will reconcile state later.
    }
  }

  return (
    <>
      <NextTopLoader color="#6680ff" showSpinner={false} />
      <NextIntlClientProvider messages={messages}>
        <DeviceFingerprintProvider />

        <UserStateProvider
          initialToken={initialToken}
          initialUser={initialUser}
          initialConfig={config}
        >
          <Header categories={category.data?.data.data} />
          <div className="flex flex-1 flex-col min-h-screen">{children}</div>
          <NotificationContainer />
        </UserStateProvider>
      </NextIntlClientProvider>
    </>
  );
}
