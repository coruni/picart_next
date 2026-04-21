import type { CreateClientConfig } from "./api/client.gen";
import {
  buildAuthHeaders,
  getRequestAuthState,
} from "./lib/request-auth";
import { resilientFetch } from "./lib/resilient-fetch";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
  fetch: resilientFetch,
});

let interceptorsInitialized = false;
let initializationPromise: Promise<void> | null = null;

export function initializeInterceptors(): Promise<void> {
  if (interceptorsInitialized) return Promise.resolve();
  if (initializationPromise) return initializationPromise;

  initializationPromise = import("./api/client.gen")
    .then(({ client }) => {
      client.interceptors.request.use(async (request) => {
        try {
          const { token, deviceId } = await getRequestAuthState();
          const headers = await buildAuthHeaders(request.headers as HeadersInit);
          request.headers = headers;

          void token;
          void deviceId;
        } catch (error) {
          console.error("Error in request interceptor:", error);
        }
      });

      client.interceptors.response.use(async (response) => response);

      client.interceptors.error.use(async (error) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[auth][interceptor] response error", {
            error,
          });
        }

        // 尝试从 error 中获取 response
        const err = error as { code?: number; response?: { code?: number }; request?: { url?: string } };
        const status = err?.code ?? err?.response?.code;
        const requestUrl = err?.request?.url ?? "";

        // 跳过 refresh token 端点本身的错误（防止无限循环）
        if (requestUrl.includes("/refresh-token")) {
          console.warn("[auth] Refresh token request failed, clearing auth state");
          try {
            const { useUserStore } = await import("./stores/useUserStore");
            await useUserStore.getState().logout();
          } catch (logoutError) {
            console.error("[auth] Error during logout:", logoutError);
          }
          return error;
        }

        // 处理 401 未授权错误
        if (status === 401 && typeof window !== "undefined") {
          // 先检查是否有 refreshToken，没有则直接退出
          const { useUserStore } = await import("./stores/useUserStore");
          const { refreshToken } = useUserStore.getState();

          if (!refreshToken) {
            console.warn("[auth] No refresh token available, logging out");
            await useUserStore.getState().logout();
            return error;
          }

          // 尝试刷新 token
          try {
            const refreshed = await useUserStore.getState().refreshAccessToken();
            console.log("[auth] Token refresh result:", refreshed);
            if (!refreshed) {
              console.warn("[auth] Token refresh failed, logging out");
              // 显式调用 logout 确保状态被清空
              await useUserStore.getState().logout();
            }
          } catch (refreshError) {
            console.error("[auth] Error during token refresh:", refreshError);
            // 刷新过程中出错，也需要登出
            try {
              await useUserStore.getState().logout();
            } catch (logoutError) {
              console.error("[auth] Error during logout:", logoutError);
            }
          }
        }

        // 返回错误而不是抛出，确保错误结构被保留
        return error;
      });

      interceptorsInitialized = true;
    })
    .catch((error) => {
      console.error("Failed to initialize API interceptors:", error);
      throw error;
    });

  return initializationPromise;
}
