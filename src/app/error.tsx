"use client";

import { cn } from "@/lib";
import { Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TEXT = {
  title: "Something went wrong",
  description: "Sorry, we encountered a problem loading this page. Please try again later.",
  errorDetails: "Error Details",
  tryAgain: "Try Again",
  backHome: "Back to Home",
};

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  const handleRetry = () => {
    reset();
    router.refresh();
  };

  return (
    <div className="h-screen max-w-2xl mx-auto p-6 flex flex-col items-center justify-center bg-background text-foreground">
    
      <h1 className="text-6xl font-bold text-primary mb-4">500</h1>

      <p className="text-xl text-muted-foreground mb-2 text-center">
        {TEXT.title}
      </p>
      <p className="text-base text-muted-foreground/80 mb-8 text-center max-w-md">
        {TEXT.description}
      </p>

      {process.env.NODE_ENV === "development" && error.message && (
        <div className="w-full max-w-md mb-8 p-4 rounded-xl border border-red-300 bg-error/5 text-left">
          <p className="text-sm font-medium text-error mb-2">{TEXT.errorDetails}</p>
          <p className="text-xs text-error/80 wrap-break-word font-mono">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleRetry}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 rounded-full",
            "bg-primary text-white hover:opacity-90 transition-all duration-300",
            "hover:shadow-lg"
          )}
        >
          <RefreshCcw className="h-4 w-4" />
          {TEXT.tryAgain}
        </button>
        <Link
          href="/"
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 rounded-full",
            "text-primary border border-primary hover:opacity-90 transition-all duration-300",
            "hover:bg-primary hover:text-white"
          )}
        >
          <Home className="h-4 w-4" />
          {TEXT.backHome}
        </Link>
      </div>
    </div>
  );
}
