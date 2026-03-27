"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

type ErrorMessages = {
  title: string;
  description: string;
  errorDetails: string;
  tryAgain: string;
  backHome: string;
  helpText: string;
};

const ZH_FALLBACK: ErrorMessages = {
  title: "出错了",
  description: "抱歉，页面加载时遇到了问题。请稍后重试。",
  errorDetails: "错误详情",
  tryAgain: "重试",
  backHome: "返回首页",
  helpText: "如果问题持续存在，请联系我们的支持团队",
};

const EN_FALLBACK: ErrorMessages = {
  title: "Something went wrong",
  description: "Sorry, we encountered a problem loading this page. Please try again later.",
  errorDetails: "Error details",
  tryAgain: "Try again",
  backHome: "Back to home",
  helpText: "If the problem persists, please contact our support team",
};

function getFallbackMessages(): ErrorMessages {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) {
    return ZH_FALLBACK;
  }

  return EN_FALLBACK;
}

function useErrorMessages() {
  const fallback = getFallbackMessages();

  try {
    const t = useTranslations("error");
    return {
      title: t("title"),
      description: t("description"),
      errorDetails: t("errorDetails"),
      tryAgain: t("tryAgain"),
      backHome: t("backHome"),
      helpText: t("helpText"),
    };
  } catch {
    return fallback;
  }
}

export function AppErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const text = useErrorMessages();

  useEffect(() => {
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-2xl border border-border/70 bg-background/95 p-6 shadow-sm sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error-500/10 text-error-500">
          <AlertTriangle className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-2xl font-semibold text-foreground">{text.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{text.description}</p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-5 rounded-xl border border-border/70 bg-muted/50 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              {text.errorDetails}
            </summary>
            <div className="mt-3 max-h-44 overflow-auto rounded-lg bg-background p-3 text-xs font-mono">
              <p className="break-words text-error-500">{error.message}</p>
              {error.digest && <p className="mt-2 text-muted-foreground">Digest: {error.digest}</p>}
            </div>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="w-full sm:w-auto" size="lg">
            <RefreshCcw className="h-4 w-4" />
            {text.tryAgain}
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto" size="lg">
              <Home className="h-4 w-4" />
              {text.backHome}
            </Button>
          </Link>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">{text.helpText}</p>
      </div>
    </div>
  );
}

