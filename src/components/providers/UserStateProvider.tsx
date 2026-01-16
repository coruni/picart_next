"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { initializeInterceptors } from "@/rumtime.config";
import type { UserProfile } from "@/types";

interface UserStateProviderProps {
  initialToken: string | null;
  initialUser: UserProfile | null;
  children: React.ReactNode;
}

/**
 * 用户状态提供者
 * 在客户端 hydration 时同步服务端的认证状态和用户资料
 */
export function UserStateProvider({ initialToken, initialUser, children }: UserStateProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 使用 selector 获取响应式状态
  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.user);
  const setToken = useUserStore((state) => state.setToken);
  const setUser = useUserStore((state) => state.setUser);
  const logout = useUserStore((state) => state.logout);

  useEffect(() => {
    // 只在初始化时执行一次
    if (isInitialized) return;
    
    // 初始化 API 客户端拦截器
    initializeInterceptors();
    
    // 服务端没有 token，但客户端 store 有 token，说明用户已登出，清除客户端状态
    if (!initialToken && token) {
      logout();
    }
    // 服务端有 token，但客户端 store 没有或不一致，同步到 store
    else if (initialToken && initialToken !== token) {
      setToken(initialToken);
    }

    // 服务端有用户资料，同步到 store（如果不一致）
    if (initialUser && (!user || user.id !== initialUser.id)) {
      setUser(initialUser);
    }
    // 服务端没有用户资料，但客户端有，清除客户端状态
    else if (!initialUser && user) {
      setUser(null);
    }

    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 在初始化完成前，不渲染子组件，避免水合错误
  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}
