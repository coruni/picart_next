import { Suspense } from "react";
import { FeedList } from "@/components/home/FeedList";
import { FeedListSkeleton } from "@/components/home/FeedListSkeleton";

export default function FollowPage() {
  return (
    <Suspense fallback={<FeedListSkeleton />}>
      <FeedList type="follow" />
    </Suspense>
  );
}
