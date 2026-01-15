export function FeedListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          {/* 作者信息骨架 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>

          {/* 内容骨架 */}
          <div className="space-y-2 mb-4">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>

          {/* 图片骨架 */}
          <div className="h-64 bg-gray-200 rounded-lg mb-4" />

          {/* 操作栏骨架 */}
          <div className="flex gap-6">
            <div className="h-5 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
