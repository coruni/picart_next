import { AnalyticsScripts } from "@/components/providers/AnalyticsScripts";
import { Suspense } from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans-webfont/misans/misans-normal/result.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans-webfont/misans/misans-semibold/result.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <Suspense>
          <AnalyticsScripts />
        </Suspense>
        {children}
      </body>
    </html>
  );
}