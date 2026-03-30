"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

const ZH_MESSAGES = {
  title: "出错了",
  description: "抱歉，页面加载时遇到了问题。请稍后重试。",
  errorDetails: "错误详情",
  tryAgain: "重试",
  backHome: "返回首页",
  helpText: "如果问题持续存在，请联系我们的支持团队",
};

const EN_MESSAGES = {
  title: "Something went wrong",
  description:
    "Sorry, we encountered a problem loading this page. Please try again later.",
  errorDetails: "Error details",
  tryAgain: "Try again",
  backHome: "Back to home",
  helpText: "If the problem persists, please contact our support team",
};

function getMessages(): typeof ZH_MESSAGES {
  if (
    typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("zh")
  ) {
    return ZH_MESSAGES;
  }
  return EN_MESSAGES;
}

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const text = getMessages();
  const router = useRouter();

  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  const handleRetry = () => {
    reset();
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error-500/10 text-error-500">
          <AlertTriangle className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            {text.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {text.description}
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-5 rounded-xl border border-border/70 bg-muted/50 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              {text.errorDetails}
            </summary>
            <div className="mt-3 max-h-44 overflow-auto rounded-lg bg-background p-3 text-xs font-mono">
              <p className="wrap-break-word text-error-500">{error.message}</p>
              {error.digest && (
                <p className="mt-2 text-muted-foreground">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={handleRetry}
            className="w-full sm:w-auto rounded-full"
          >
            <RefreshCcw className="h-4 w-4" />
            {text.tryAgain}
          </Button>
          <a href={`/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "zh"}`}>
            <Button variant="outline" className="w-full sm:w-auto rounded-full">
              <Home className="h-4 w-4" />
              {text.backHome}
            </Button>
          </a>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {text.helpText}
        </p>
      </div>
    </div>
  );
}
