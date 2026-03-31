import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { serverApi } from "@/lib/server-api";
import { UserDetail } from "@/types";

export const getAccountUser = cache(async (id: string): Promise<UserDetail> => {
  const { data } = await serverApi.userControllerFindOne({ path: { id } });
  const user = data?.data;

  if (!user) {
    notFound();
  }

  return user;
});
