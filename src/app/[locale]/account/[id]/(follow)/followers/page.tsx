import { FollowersListClient } from "@/components/account/FollowersList.client";
import { PrivacyBlockedPlaceholder } from "@/components/shared";
import { isAccountSectionHidden } from "@/lib/account-privacy";
import { getCurrentUserId } from "@/lib/current-user";
import { serverApi } from "@/lib/server-api";
import { UserList } from "@/types";
import { getTranslations } from "next-intl/server";
import { getAccountUser } from "../../account-user";

export default async function AccountFollowersPage({
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

  if (isAccountSectionHidden(accountUser, "followers", viewerId)) {
    return (
      <PrivacyBlockedPlaceholder
        title={t("followersHiddenTitle")}
        description={t("followersHiddenDescription")}
      />
    );
  }

  const response = await serverApi.userControllerGetFollowers({
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
        <span>{t("followers")}</span>
      </div>
      <div className="px-4 pb-4">
        <FollowersListClient
          initUsers={users}
          initPage={2}
          initTotal={total}
          id={id}
        />
      </div>
    </div>
  );
}
