import { commentControllerGetUserComments } from "@/api";
import { CommentListClient } from "@/components/account/CommentList.client";

// Server action wrapper for client component
async function fetchUserComments(params: any) {
    "use server";
    return await commentControllerGetUserComments(params);
}

export default async function AccountCommentPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id } = await params;
    // 加载首屏评论数据 
    const { data } = await commentControllerGetUserComments({
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