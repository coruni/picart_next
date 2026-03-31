"use client";

import { articleControllerFindHotSearch } from "@/api";

const HOT_SEARCH_CACHE_KEY = "hot-search-widget";
const HOT_SEARCH_CACHE_TIME = 30 * 60 * 1000;

let hotSearchMemoryCache: string[] | null = null;
let hotSearchPendingRequest: Promise<string[]> | null = null;

function getCachedHotSearches() {
  if (hotSearchMemoryCache && hotSearchMemoryCache.length > 0) {
    return hotSearchMemoryCache;
  }

  try {
    const cached = sessionStorage.getItem(HOT_SEARCH_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (!Array.isArray(data)) return null;

    if (Date.now() - timestamp < HOT_SEARCH_CACHE_TIME) {
      hotSearchMemoryCache = data;
      return data;
    }

    sessionStorage.removeItem(HOT_SEARCH_CACHE_KEY);
  } catch {}

  return null;
}

function setCachedHotSearches(data: string[]) {
  hotSearchMemoryCache = data;

  try {
    sessionStorage.setItem(
      HOT_SEARCH_CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch {}
}

export async function getHotSearchKeywords(fallbackHotSearches: string[]) {
  const cached = getCachedHotSearches();
  if (cached && cached.length > 0) {
    return cached;
  }

  if (hotSearchPendingRequest) {
    return hotSearchPendingRequest;
  }

  hotSearchPendingRequest = (async () => {
    try {
      const response = await articleControllerFindHotSearch({
        query: {
          limit: 8,
        },
      });

      const items = response.data?.data?.data;
      if (!Array.isArray(items)) {
        return fallbackHotSearches;
      }

      const keywords = items
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

      const finalKeywords =
        keywords.length > 0 ? keywords : fallbackHotSearches;

      setCachedHotSearches(finalKeywords);
      return finalKeywords;
    } catch (error) {
      console.error("Hot search fetch error:", error);
      return fallbackHotSearches;
    } finally {
      hotSearchPendingRequest = null;
    }
  })();

  return hotSearchPendingRequest;
}
