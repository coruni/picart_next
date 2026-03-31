import { SearchUserListClient } from "@/components/search/SearchUserList.client";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";

type SearchUserPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchUserPage(props: SearchUserPageProps) {
  const t = await getTranslations("searchPage");
  const { q = "" } = await props.searchParams;
  const keyword = q.trim();

  const response = keyword
    ? await serverApi.userControllerFindAll({
        query: {
          username: keyword,
          page: 1,
          limit: 10,
        },
      })
    : null;

  const users = response?.data?.data?.data || [];
  const total = response?.data?.data?.meta?.total || 0;

  return (
    <div className="rounded-xl bg-card">
      <div className="p-4 font-semibold">
        <span>{t("relatedUsers")}</span>
      </div>
      <div className="px-4 pb-4">
        <SearchUserListClient
          key={keyword}
          initUsers={users}
          initPage={2}
          initTotal={total}
          keyword={keyword}
        />
      </div>
    </div>
  );
}
