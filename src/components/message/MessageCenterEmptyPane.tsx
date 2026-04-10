"use client";

import { MessageCircleMore } from "lucide-react";

export function MessageCenterEmptyPane({
  chatList,
  detailPlaceholder,
  unreadCount,
  unreadSuffix,
}: {
  chatList: string;
  detailPlaceholder: string;
  unreadCount: number;
  unreadSuffix: string;
}) {
  return (
    <section className="hidden min-h-0 min-w-0 flex-1 bg-background md:flex md:flex-col">
      <div className="flex min-h-0 flex-1 items-center justify-center px-10">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex size-18 items-center justify-center rounded-full border border-border bg-muted/60 text-primary">
            <MessageCircleMore className="size-8" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">{chatList}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {detailPlaceholder}
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {unreadCount} {unreadSuffix}
          </p>
        </div>
      </div>
    </section>
  );
}

