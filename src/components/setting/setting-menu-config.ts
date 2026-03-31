import { Lock, MessageCircle, Monitor, User, UserRoundX } from "lucide-react";

export const settingMenuItems = [
  {
    labelKey: "myInfo",
    href: "/setting",
    icon: User,
  },
  {
    labelKey: "messageManagement",
    href: "/setting/notification",
    icon: MessageCircle,
  },
  {
    labelKey: "privacySettings",
    href: "/setting/privacy",
    icon: Lock,
  },
  {
    labelKey: "blockedUsers",
    href: "/setting/blocked-users",
    icon: UserRoundX,
  },
  {
    labelKey: "systemSettings",
    href: "/setting/system",
    icon: Monitor,
  },
] as const;
