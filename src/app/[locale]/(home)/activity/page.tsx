import { serverApi } from "@/lib/server-api";
import { ActivityList } from "@/components/home/ActivityList.client";

export default async function ActivityPage() {
  // SSR: 服务端获取第一页活动数据
  const initialData = await serverApi.decorationControllerFindAllActivities({
    query: {
      page: 1,
      limit: 10,
    },
    cache: "no-store",
    next: { revalidate: 0 },
  }).catch(() => ({ data: { data: { data: [], meta: { total: 0 } } } }));

  const activities = initialData?.data?.data?.data || [];
  const total = initialData?.data?.data?.meta?.total || 0;

  return (
    <ActivityList
      initActivities={activities}
      initPage={2}
      initTotal={total}
    />
  );
}
