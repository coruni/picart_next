import { AccountTopicListClient } from "@/components/account/AccountTopicList.client";
import { serverApi } from "@/lib/server-api";
import { TagList } from "@/types";

export default async function AccountTopicPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  let tags: TagList = [];
  let total = 0;

  try {
    const response = await serverApi.tagControllerFollowedList({
      query: {
        page: 1,
        limit: 10,
        userId: Number(id),
      },
    });

    tags = (response.data?.data?.data as TagList | undefined) || [];
    total = response.data?.data?.meta?.total || 0;
  } catch (error) {
    console.error("Failed to fetch account topics:", error);
  }

  return (
    <div className="rounded-xl bg-card">
      <div className="px-4 pb-4">
        <AccountTopicListClient
          initTags={tags}
          initPage={2}
          initTotal={total}
          userId={Number(id)}
        />
      </div>
    </div>
  );
}
