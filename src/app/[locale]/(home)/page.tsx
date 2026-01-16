import { Suspense } from "react";
import { FeedList } from "@/components/home/FeedList";
import { FeedListSkeleton } from "@/components/home/FeedListSkeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<FeedListSkeleton />}>
      <FeedList type="recommend" />
    </Suspense>
  );
}
