"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    // 记录错误到错误报告服务
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 错误图标 */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
            <div className="relative bg-red-500/10 p-6 rounded-full">
              <AlertTriangle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-base">
            {t("description")}
          </p>
          
          {/* 开发环境显示错误详情 */}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                {t("errorDetails")}
              </summary>
              <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-40">
                <p className="text-red-600 dark:text-red-400">{error.message}</p>
                {error.digest && (
                  <p className="mt-2 text-muted-foreground">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={reset} className="w-full sm:w-auto gap-2">
            <RefreshCcw size={18} />
            {t("tryAgain")}
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Home size={18} />
              {t("backHome")}
            </Button>
          </Link>
        </div>

        {/* 帮助提示 */}
        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            {t("helpText")}
          </p>
        </div>
      </div>
    </div>
  );
}
