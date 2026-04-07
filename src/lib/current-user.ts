import "server-only";

import { serverApi } from "@/lib/server-api";
import { UserProfile } from "@/types";

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const { data } = await serverApi.userControllerGetProfile();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id != null ? String(user.id) : null;
}
