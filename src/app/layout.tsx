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
        {/* DNS 预解析和预连接 */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        {/* 预加载关键字体 CSS - 使用 preload 提高优先级 */}
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/npm/misans-webfont/misans/misans-normal/result.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/npm/misans-webfont/misans/misans-semibold/result.min.css"
          crossOrigin="anonymous"
        />

        {/* 实际加载字体 CSS */}
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