"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

const googleMeasurementId =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() || "";
const clarityProjectId =
  process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID?.trim() || "";
const excludedRoutePrefixes = ["/message", "/dashboard"] as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
}

function isAnalyticsExcluded(pathname: string) {
  const normalizedPathname = stripLocalePrefix(pathname);
  return excludedRoutePrefixes.some(
    (prefix) =>
      normalizedPathname === prefix ||
      normalizedPathname.startsWith(`${prefix}/`),
  );
}

export function AnalyticsScripts() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasGoogleAnalytics = Boolean(googleMeasurementId);
  const hasClarity = Boolean(clarityProjectId);
  const analyticsExcluded = isAnalyticsExcluded(pathname);
  const pagePath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  useEffect(() => {
    if (
      !hasGoogleAnalytics ||
      analyticsExcluded ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [analyticsExcluded, hasGoogleAnalytics, pagePath]);

  if (!hasGoogleAnalytics && !hasClarity) {
    return null;
  }

  return (
    <>
      {hasClarity && !analyticsExcluded ? (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);
              t.async=1;
              t.src="https://www.clarity.ms/tag/" + i;
              y=l.getElementsByTagName(r)[0];
              y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityProjectId}");
          `}
        </Script>
      ) : null}

      {hasGoogleAnalytics ? (
        <>
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              gtag('config', '${googleMeasurementId}', { send_page_view: false });
            `}
          </Script>
          <Script
            id="google-analytics-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleMeasurementId}`}
            strategy="lazyOnload"
          />
        </>
      ) : null}
    </>
  );
}
