"use client";

import { userControllerGithubOAuthCallback } from "@/api";
import { useUserStore } from "@/stores";
import type { UserProfile } from "@/types";
import { useEffect, useRef } from "react";

/**
 * GitHub OAuth 回调页：只做登录授权，不渲染任何页面内容。
 *
 * 流程：
 * 1. GitHub 授权后 302 回前端域名，携带 code / state
 * 2. 本页静默调用后端 POST /user/oauth/github/callback 换取 JWT
 * 3. 写入登录态后跳转首页（无论成功失败都跳首页）
 */
export default function OAuthCallbackPage() {
  const login = useUserStore((state) => state.login);
  const handledRef = useRef(false);

  useEffect(() => {
    // 防止 React StrictMode 下重复执行
    if (handledRef.current) return;
    handledRef.current = true;

    const backHome = () => window.location.replace("/");

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");

    // GitHub 拒绝授权或缺少 code，直接回首页
    if (errorParam || !code) {
      backHome();
      return;
    }

    (async () => {
      try {
        const { data } = await userControllerGithubOAuthCallback({
          body: { code, state: state || undefined },
        });

        const payload = (
          data as {
            data?: {
              token?: string;
              refreshToken?: string;
              [key: string]: unknown;
            };
          } | undefined
        )?.data;

        if (payload?.token) {
          const { token, refreshToken, ...userData } = payload;
          login(userData as unknown as UserProfile, token, refreshToken || "");
        }
      } catch {
        // 静默失败，回首页后可再次发起登录
      } finally {
        backHome();
      }
    })();
  }, [login]);

  // 无页面内容
  return null;
}
