import type { CreateClientConfig } from "./api/client.gen";
import {
  buildAuthHeaders,
  getRequestAuthState,
} from "./lib/request-auth";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
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

      client.interceptors.error.use(async (error, response) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[auth][interceptor] response error", {
            status: response?.status ?? null,
            isServer: typeof window === "undefined",
            error,
          });
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
