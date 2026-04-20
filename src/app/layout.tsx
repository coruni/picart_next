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
      <body className="antialiased">
        <Suspense>
          <AnalyticsScripts />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
