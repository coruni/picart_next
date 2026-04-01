import { FollowingsListClient } from "@/components/account/FollowingsList.client";
import { PrivacyBlockedPlaceholder } from "@/components/shared";
import { isAccountSectionHidden } from "@/lib/account-privacy";
import { getCurrentUserId } from "@/lib/current-user";
import { serverApi } from "@/lib/server-api";
import { UserList } from "@/types";
import { getTranslations } from "next-intl/server";
import { getAccountUser } from "../../account-user";

export default async function AccountFollowingsPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const [t, accountUser, viewerId] = await Promise.all([
    getTranslations("userList"),
    getAccountUser(id),
    getCurrentUserId(),
  ]);

  if (isAccountSectionHidden(accountUser, "followings", viewerId)) {
    return (
      <PrivacyBlockedPlaceholder
        title={t("followingsHiddenTitle")}
        description={t("followingsHiddenDescription")}
      />
    );
  }

  const response = await serverApi.userControllerGetFollowings({
    path: { id },
    query: {
      page: 1,
      limit: 10,
      keyword: "",
    },
  });

  const users = ((response.data?.data?.data as UserList | undefined) || []);
  const total = response.data?.data?.meta?.total || 0;

  return (
    <div className="rounded-xl bg-card">
      <div className="border-b border-border px-4 py-4 font-semibold">
        <span>{t("following")}</span>
      </div>
      <div className="px-4 pb-4">
        <FollowingsListClient
          initUsers={users}
          initPage={2}
          initTotal={total}
          id={id}
        />
      </div>
    </div>
  );
}
