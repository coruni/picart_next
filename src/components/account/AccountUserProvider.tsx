"use client";

import { UserDetail } from "@/types";
import { createContext, useContext } from "react";

const AccountUserContext = createContext<UserDetail | null>(null);

type AccountUserProviderProps = {
  user: UserDetail;
  children: React.ReactNode;
};

export function AccountUserProvider({
  user,
  children,
}: AccountUserProviderProps) {
  return (
    <AccountUserContext.Provider value={user}>
      {children}
    </AccountUserContext.Provider>
  );
}

export function useAccountUser() {
  const context = useContext(AccountUserContext);

  if (!context) {
    throw new Error("useAccountUser must be used within AccountUserProvider");
  }

  return context;
}
