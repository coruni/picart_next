"use client";

import { cn } from "@/lib";

type CommentSkeletonProps = {
  className?: string;
};

export function CommentSkeleton({ className }: CommentSkeletonProps) {
  return (
    <div className={cn("flex gap-3 p-4", className)}>
      {/* Avatar skeleton */}
      <div className="size-10 shrink-0 rounded-full bg-muted animate-pulse" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        {/* Username skeleton */}
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />

        {/* Comment text skeleton */}
        <div className="space-y-1">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        </div>

        {/* Actions skeleton */}
        <div className="flex gap-4 pt-2">
          <div className="h-3 w-12 bg-muted animate-pulse rounded" />
          <div className="h-3 w-12 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

type CommentListSkeletonProps = {
  count?: number;
  className?: string;
};

export function CommentListSkeleton({
  count = 8,
  className,
}: CommentListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CommentSkeleton key={index} />
      ))}
    </div>
  );
}