/**
 * unstable_cache 使用的 tag 常量。
 * 前端写操作成功后调用 revalidateCacheTags() 让这些缓存立即失效。
 */
export const CACHE_TAGS = {
  config: "public-config",
  categories: "public-categories",
  hotSearch: "public-hot-search",
  tags: "public-tags",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const CACHE_TAG_VALUES: readonly CacheTag[] = Object.values(CACHE_TAGS);
