import type { CacheTag } from "./cache-tags";

/**
 * 写操作成功后调用，让 unstable_cache 的条目立即失效。
 * 失败不抛错：缓存晚一点过期不影响主流程。
 */
export async function revalidateCacheTags(tags: CacheTag[]): Promise<void> {
  if (tags.length === 0) {
    return;
  }

  try {
    const response = await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
      credentials: "same-origin",
    });

    if (!response.ok && process.env.NODE_ENV === "development") {
      console.warn("[cache] revalidate rejected", response.status, tags);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[cache] revalidate failed", error);
    }
  }
}
