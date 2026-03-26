import { CommentListClient } from "@/components/account/CommentList.client";
import { serverApi } from "@/lib/server-api";


export default async function AccountCommentPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id } = await params;
    // 加载首屏评论数据 
    const { data } = await serverApi.commentControllerGetUserComments({
        path: { userId: id }
    })
    return (
        <CommentListClient
            initPage={2}
            initTotal={data?.data?.meta?.total || 0}
            initComments={data?.data?.data || []}
            id={id}
        />
    )
}
