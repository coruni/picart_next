import { tagControllerFindAll } from "@/api";
import Link from "next/link";

export async function TrendingTopics() {
  // SSR: 获取热门话题
  const response = await tagControllerFindAll({
    query: {
      page: 1,
      limit: 10,
    },
  });

  const tags = response.data?.data || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">🔥 热门话题</h3>
        <Link href="/topics" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          查看更多
        </Link>
      </div>
      <div className="space-y-1">
        {tags.slice(0, 8).map((tag, index) => (
          <Link
            key={tag.id}
            href={`/tag/${tag.id}`}
            className="flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-3 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" :
                index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                index === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" :
                "bg-gray-100 text-gray-600"
              }`}>
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {tag.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                {tag.articleCount || 0}
              </span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
