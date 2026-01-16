import { articleControllerFindAll } from "@/api";
import { FeedCard } from "./FeedCard";
import type { ArticleList } from "@/types";

interface FeedListProps {
  type?: "follow" | "recommend" | "activity";
}

export async function FeedList({ type = "follow" }: FeedListProps) {


  const articles = []

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无内容
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
    </div>
  );
}
