import { serverApi } from "@/lib/server-api";

export default async function ActivityPage() {
  // SSR: 服务端获取第一页数据
  const initialData = await serverApi.articleControllerFindAll({
    query: {
      page: 1,
      limit: 20,
      type: "activity",
    },
    
  }).catch(() => ({ data: { data: { list: [], total: 0 } } }));

  const _articles = initialData?.data?.data || [];
  const _total = initialData?.data?.data

  return (
    <></>
  );
}
