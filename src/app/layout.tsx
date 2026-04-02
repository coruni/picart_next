import { AnalyticsScripts } from "@/components/providers/AnalyticsScripts";
import localFont from "next/font/local";
import "./globals.css";

const miSans = localFont({
  src: [
    {
      path: "./fonts/MiSans-Normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/MiSans-Regular.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/MiSans-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  fallback: [
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "HarmonyOS Sans SC",
    "Noto Sans SC",
    "Segoe UI",
    "Helvetica Neue",
    "Arial",
  ],
  variable: "--font-misans",
  display: "swap",
  preload: true,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={miSans.className}>
      <body className="antialiased">
        <AnalyticsScripts />
        {children}
      </body>
    </html>
  );
}
