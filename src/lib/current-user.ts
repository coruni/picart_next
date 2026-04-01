import "server-only";

import { cache } from "react";

import { serverApi } from "@/lib/server-api";
import { UserProfile } from "@/types";

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  try {
    const { data } = await serverApi.userControllerGetProfile();
    return data?.data ?? null;
  } catch {
    return null;
  }
});

export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id != null ? String(user.id) : null;
});
