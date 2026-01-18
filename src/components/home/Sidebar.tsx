import { bannerControllerFindActive } from "@/api";
import Image from "next/image";
import Link from "next/link";

export async function Sidebar() {
  // SSR: 获取活跃的 Banner
  const response = await bannerControllerFindActive({});

  const banners = response.data?.data || [];

  return (
    <div className="space-y-6">
      {/* 推荐用户 */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">👥 推荐关注</h3>
          <Link href="/users" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看更多
          </Link>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                  U{i}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    用户 {i}
                  </div>
                  <div className="text-xs text-gray-500">创作者</div>
                </div>
              </div>
              <button className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105">
                关注
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Banner 广告 */}
      {banners.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.linkUrl || "#"}
              className="block relative w-full h-48 group overflow-hidden"
            >
              {banner.imageUrl && (
                <Image
                  src={banner.imageUrl}
                  alt={banner.title || "广告"}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}

      {/* 页脚链接 */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="text-xs text-gray-500 space-y-3">
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            <Link href="/about" className="hover:text-blue-600 transition-colors font-medium">
              关于
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/help" className="hover:text-blue-600 transition-colors font-medium">
              帮助
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/terms" className="hover:text-blue-600 transition-colors font-medium">
              条款
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors font-medium">
              隐私
            </Link>
          </div>
          <div className="text-gray-400 pt-2 border-t border-gray-100">
            © 2026 PicArt. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
