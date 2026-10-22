import "server-only";

import { serverApi } from "@/lib/server-api";
import { UserProfile } from "@/types";
import { cache } from "react";

// 同一次请求内 layout / sidebar / page 会各自调用，cache() 保证只打一次 /user/profile
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  try {
    const { data } = await serverApi.userControllerGetProfile();
    return data?.data ?? null;
  } catch {
    return null;
  }
});

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id != null ? String(user.id) : null;
}
