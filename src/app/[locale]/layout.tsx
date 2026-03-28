import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { NotificationContainer } from "@/components/shared";
import {
  generateSiteMetadata,
  getPublicCategories,
  getPublicConfig,
} from "@/lib/seo";
import { DeviceFingerprintProvider } from "@/components/providers/DeviceFingerprintProvider";
import { AuthRouteGuard } from "@/components/providers/AuthRouteGuard";
import { UserStateProvider } from "@/components/providers/UserStateProvider";
import { getServerCookie } from "@/lib/server-cookies";
import {
  buildAuthHeaders,
  DEVICE_ID_COOKIE_NAME,
  getAuthDebugSnapshot,
  TOKEN_COOKIE_NAME,
} from "@/lib/request-auth";
import { serverApi } from "@/lib/server-api";
import NextTopLoader from "nextjs-toploader";
import type { UserProfile } from "@/types";

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

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][layout] SSR cookie snapshot", {
      hasInitialToken: !!initialToken,
      initialTokenPreview: initialToken ? `${initialToken.slice(0, 12)}...` : null,
      deviceId,
      locale,
      dynamicMode: "force-dynamic",
    });

    console.log("[auth][layout] SSR request headers snapshot", {
      ...getAuthDebugSnapshot(requestHeaders),
      rawCookieTokenPreview: initialToken ? `${initialToken.slice(0, 12)}...` : null,
      rawCookieDeviceId: deviceId,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][layout] category request start", {
      ...getAuthDebugSnapshot(requestHeaders),
    });
  }
  const categories = await getPublicCategories();

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][layout] category request end", {
      ...getAuthDebugSnapshot(requestHeaders),
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][layout] public-config request start", {
      ...getAuthDebugSnapshot(requestHeaders),
    });
  }
  const config = await getPublicConfig();

  if (process.env.NODE_ENV === "development") {
    console.log("[auth][layout] public-config request end", {
      ...getAuthDebugSnapshot(requestHeaders),
    });
  }
  let initialUser: UserProfile | null = null;

  if (initialToken) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[auth][layout] profile request start", {
          ...getAuthDebugSnapshot(requestHeaders),
          tokenPreview: initialToken ? `${initialToken.slice(0, 12)}...` : null,
          deviceId,
        });
      }

      const response = await serverApi.userControllerGetProfile({
        next: { revalidate: 0 },
      });
      initialUser = response?.data?.data || null;

      if (process.env.NODE_ENV === "development") {
        console.log("[auth][layout] profile fetch result", {
          status: response.response.status,
          hasInitialUser: !!initialUser,
          userId: initialUser?.id ?? null,
          ...getAuthDebugSnapshot(requestHeaders),
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[auth][layout] profile fetch failed", {
          hasInitialToken: !!initialToken,
          deviceId,
          ...getAuthDebugSnapshot(requestHeaders),
          error,
        });
      }
    }
  } else if (process.env.NODE_ENV === "development") {
    console.log("[auth][layout] skipped profile fetch because token is missing", {
      deviceId,
    });
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
          <AuthRouteGuard />
          <Header categories={categories} />
          <div className="flex flex-1 flex-col min-h-screen">{children}</div>
          <NotificationContainer />
        </UserStateProvider>
      </NextIntlClientProvider>
    </>
  );
}
