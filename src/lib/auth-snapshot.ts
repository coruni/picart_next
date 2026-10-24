"use client";

import type { UserProfile } from "@/types";
import { createContext } from "react";

/**
 * 服务端（SSR）解析出来的登录态。
 *
 * zustand store 是模块级单例，服务端不可能按请求写入（会串号），
 * 所以由 [locale]/layout 把 cookie + profile 的结果通过 context 下发给整棵客户端树，
 * 由 useUserStore 在 store 接管之前读取，保证首屏 HTML 就带登录态。
 */
export interface AuthSnapshot {
  user: UserProfile | null;
  isAuthenticated: boolean;
}

export const emptyAuthSnapshot: AuthSnapshot = {
  user: null,
  isAuthenticated: false,
};

export const AuthSnapshotContext = createContext<AuthSnapshot>(emptyAuthSnapshot);
