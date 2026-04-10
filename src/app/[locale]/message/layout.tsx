import { MessageCenterLayoutClient } from "@/components/message/MessageCenterLayout.client";
import type { ReactNode } from "react";

export default function MessageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MessageCenterLayoutClient>{children}</MessageCenterLayoutClient>;
}

