"use client";

import { AuthSnapshotContext, type AuthSnapshot } from "@/lib/auth-snapshot";
import { useMemo } from "react";

/**
 * 把服务端解析出的登录态下发给整棵客户端树。
 * 读取方不用直接用它——`useUserStore` 会在 store 接管之前自动回落到这里的快照。
 */
export function AuthSnapshotProvider({
  value,
  children,
}: {
  value: AuthSnapshot;
  children: React.ReactNode;
}) {
  const snapshot = useMemo(() => value, [value]);

  return (
    <AuthSnapshotContext.Provider value={snapshot}>
      {children}
    </AuthSnapshotContext.Provider>
  );
}
