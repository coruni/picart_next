import { BlockedUsersClient } from "@/components/setting/BlockedUsersClient";
import { getTranslations } from "next-intl/server";

export default async function BlockedUsersPage() {
  const t = await getTranslations("setting.blockedUsers");

  return (
    <div className="px-3 py-2">
      <BlockedUsersClient />
    </div>
  );
}
