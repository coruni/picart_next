import type {
  MessageDropdownItem,
  MessageTab,
} from "@/stores/useMessageNotificationStore";

export type MessageRouteType = Exclude<MessageTab, "all">;

function isValidMessageRouteType(value: string): value is MessageRouteType {
  return (
    value === "notification" ||
    value === "private" ||
    value === "system"
  );
}

export function resolveMessageRouteType(
  value?: string | null,
): MessageRouteType | null {
  if (!value) {
    return null;
  }

  return isValidMessageRouteType(value) ? value : null;
}

export function buildMessageCenterHref(
  type: MessageRouteType,
  targetId: number | string,
  tab: MessageTab = type,
) {
  const query = new URLSearchParams();

  if (tab !== "all") {
    query.set("tab", tab);
  }

  const queryString = query.toString();
  return `/message/${type}/${targetId}${queryString ? `?${queryString}` : ""}`;
}

export function buildMessageHrefFromItem(
  item: Pick<MessageDropdownItem, "id" | "type" | "counterpartId">,
  tab: MessageTab = item.type,
) {
  const targetId =
    item.type === "private" ? Number(item.counterpartId || item.id) : item.id;

  return buildMessageCenterHref(item.type, targetId, tab);
}

