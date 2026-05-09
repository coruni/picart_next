
import { articleControllerFindHotSearch } from "@/api";
import { unstable_cache } from "next/cache";

/**
 * Fetch hot search keywords from API
 */
async function fetchHotSearchKeywords() {
  try {
    const response = await articleControllerFindHotSearch({
      query: {
        limit: 8,
      },
    });

    const items = response.data?.data?.data;
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "keyword" in item &&
          typeof item.keyword === "string"
        ) {
          return item.keyword.trim();
        }
        return "";
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Hot search fetch error:", error);
    return [];
  }
}

/**
 * Cached function to get hot search keywords on server side
 * Uses Next.js unstable_cache with 30-minute revalidation
 */
export const getHotSearchKeywordsSSR = unstable_cache(
  fetchHotSearchKeywords,
  ["hot-search-keywords"],
  {
    revalidate: 1800, // 30 minutes in seconds
  },
);
