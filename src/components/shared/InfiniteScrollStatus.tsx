"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib";
import { Loader2 } from "lucide-react";
import { RefObject } from "react";

type InfiniteScrollStatusProps = {
  observerRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  loading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingText: string;
  idleText?: string;
  retryText?: string;
  allLoadedText?: string;
  emptyText?: string;
  containerClassName?: string;
  loadingClassName?: string;
  idleTextClassName?: string;
  endClassName?: string;
  emptyClassName?: string;
};

export function InfiniteScrollStatus({
  observerRef,
  hasMore,
  loading,
  error,
  isEmpty = false,
  onRetry,
  loadingText,
  idleText,
  retryText = "Retry",
  allLoadedText,
  emptyText,
  containerClassName,
  loadingClassName,
  idleTextClassName,
  endClassName,
  emptyClassName,
}: InfiniteScrollStatusProps) {
  return (
    <>
      {hasMore && (
        <div
          ref={observerRef}
          className={cn("flex items-center justify-center py-8", containerClassName)}
        >
          {loading ? (
            <div className={cn("flex items-center gap-2", loadingClassName)}>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">{loadingText}</span>
            </div>
          ) : (
            idleText && (
              <div className={cn("text-sm", idleTextClassName)}>{idleText}</div>
            )
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <p className="mb-2 text-red-500">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="primary" disabled={loading}>
                {retryText}
              </Button>
            )}
          </div>
        </div>
      )}

      {!hasMore && !isEmpty && allLoadedText && (
        <div className={cn("flex items-center justify-center py-3 text-sm", endClassName)}>
          <div>{allLoadedText}</div>
        </div>
      )}

      {!hasMore && isEmpty && emptyText && (
        <div className={cn("flex items-center justify-center py-12", emptyClassName)}>
          <div className="text-center">
            <p>{emptyText}</p>
          </div>
        </div>
      )}
    </>
  );
}
