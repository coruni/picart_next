import { RecommendUserListClient } from "@/components/recommend/RecommendUserList.client";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";

export default async function RecommendUserPage() {
  const t = await getTranslations("recommendPage");

  const response = await serverApi.userControllerFindAll({
    query: {
      page: 1,
      limit: 10,
    },
  });

  const users = response?.data?.data?.data || [];
  const total = response?.data?.data?.meta?.total || 0;

  return (
    <div className="rounded-xl bg-card">
      <div className="p-4 font-semibold border-b border-border">
        <span>{t("title")}</span>
      </div>
      <div className="p-4">
        <RecommendUserListClient
          initUsers={users}
          initPage={2}
          initTotal={total}
          cacheKey="recommend-users"
        />
      </div>
    </div>
  );
}
