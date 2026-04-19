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
        const err = error as { status?: number; response?: { status?: number } };
        const status = err?.status ?? err?.response?.status;

        // 处理 401 未授权错误
        if (status === 401 && typeof window !== "undefined") {
          // 尝试刷新 token
          try {
            const { useUserStore } = await import("./stores/useUserStore");
            const refreshed = await useUserStore.getState().refreshAccessToken();
            console.log("[auth] Token refresh result:", refreshed);
            if (!refreshed) {
              console.warn("[auth] Token refresh failed, logged out");
            }
          } catch (refreshError) {
            console.error("[auth] Error during token refresh:", refreshError);
          }
        }

        throw error;
      });

      interceptorsInitialized = true;
    })
    .catch((error) => {
      console.error("Failed to initialize API interceptors:", error);
      throw error;
    });

  return initializationPromise;
}
