import { articleControllerFindAll } from "@/api";

export default async function ActivityPage() {
  // SSR: 服务端获取第一页数据
  const initialData = await articleControllerFindAll({
    query: {
      page: 1,
      limit: 20,
      type: "activity",
    },
  }).catch(() => ({ data: { data: { list: [], total: 0 } } }));

  const articles = initialData?.data?.data || [];
  const total = initialData?.data?.data

  return (
    <></>
  );
}
