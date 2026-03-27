"use client";

import { AppErrorState } from "@/components/shared/AppErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorState error={error} reset={reset} />;
}
