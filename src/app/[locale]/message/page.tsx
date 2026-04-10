import { MessageCenterEmptyPane } from "@/components/message/MessageCenterEmptyPane";
import { messageControllerGetUnreadCount } from "@/api";
import { getTranslations } from "next-intl/server";

export default async function MessagePage() {
  const [tMsg, unreadResponse] = await Promise.all([
    getTranslations("messageDropdown"),
    messageControllerGetUnreadCount().catch(() => null),
  ]);
  const unreadCount = unreadResponse?.data?.data?.total ?? 0;

  return (
    <MessageCenterEmptyPane
      chatList={tMsg("center.chatList")}
      detailPlaceholder={tMsg("center.detailPlaceholder")}
      unreadCount={unreadCount}
      unreadSuffix={tMsg("center.unreadSuffix")}
    />
  );
}
