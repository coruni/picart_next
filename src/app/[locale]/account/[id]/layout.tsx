import { AccountUserProvider } from "@/components/account/AccountUserProvider";
import { ReactNode } from "react";

import { notFound } from "next/navigation";
import { getAccountUser } from "./account-user";

export default async function AccountIdLayout({
  params,
  children,
}: {
  params: Promise<{ id: string; locale: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const user = await getAccountUser(id);
  if (!user) {
    return notFound();
  }

  return <AccountUserProvider user={user}>{children}</AccountUserProvider>;
}
