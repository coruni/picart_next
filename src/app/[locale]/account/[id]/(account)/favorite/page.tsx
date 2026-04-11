import { FavoriteArticleList } from "@/components/account/FavoriteArticleList.client";
import { serverApi } from "@/lib/server-api";


export default async function AccountFavoritePage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id } = await params;
    // 加载首屏评论数据 
    const { data } = await serverApi.articleControllerGetFavoritedArticles({
        query: {
            userId: Number(id),
            page: 1,
            limit: 20
        },
    })
    return (
        <FavoriteArticleList
            initArticles={data?.data.data || []}
            showFollow={false}
            initPage={2}
            initTotal={data?.data.meta.total || 0}
            id={id} />
    )
}
