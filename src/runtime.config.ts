import type { CreateClientConfig } from "./api/client.gen";
import { getCookie } from "./lib/cookies";
import { useDeviceStore } from "./stores/useDeviceStore";
import { useUserStore } from "./stores/useUserStore";

const TOKEN_COOKIE_NAME = "auth-token";
const DEVICE_ID_COOKIE_NAME = "device_fingerprint";

async function getAuthToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const storeToken = useUserStore.getState().token;
    if (storeToken) return storeToken;
    return getCookie(TOKEN_COOKIE_NAME);
  }

  try {
    const { getServerCookie } = await import("./lib/server-cookies");
    const cookieToken = await getServerCookie(TOKEN_COOKIE_NAME);
    if (cookieToken) return cookieToken;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to get auth token from cookie on server:", error);
    }
  }

  return null;
}

async function getDeviceId(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const storeDeviceId = useDeviceStore.getState().deviceId;
    if (storeDeviceId) return storeDeviceId;

    const cookieDeviceId = getCookie(DEVICE_ID_COOKIE_NAME);
    if (cookieDeviceId) {
      useDeviceStore.getState().setDeviceId(cookieDeviceId);
      return cookieDeviceId;
    }

    return null;
  }

  try {
    const { getServerCookie } = await import("./lib/server-cookies");
    const cookieDeviceId = await getServerCookie(DEVICE_ID_COOKIE_NAME);
    if (cookieDeviceId) return cookieDeviceId;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to get device ID from cookie on server:", error);
    }
  }

  return null;
}

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
          const token = await getAuthToken();
          const deviceId = await getDeviceId();

          if (!request.headers) {
            request.headers = new Headers();
          }

          const headers =
            request.headers instanceof Headers
              ? request.headers
              : new Headers(request.headers as HeadersInit);

          if (deviceId) {
            headers.set("Device-Id", deviceId);
          }

          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }

          request.headers = headers;

          if (process.env.NODE_ENV === "development") {
            const fullUrl = (request.baseUrl || "") + request.url;
            console.log("API Request:", {
              url: fullUrl,
              path: request.url,
              method: request.method || "GET",
              headers: request.headers
                ? Object.fromEntries(request.headers.entries())
                : {},
              body: request.serializedBody || request.body || null,
              hasToken: !!token,
              deviceId: deviceId || "none",
              isServer: typeof window === "undefined",
            });
          }
        } catch (error) {
          console.error("Error in request interceptor:", error);
        }
      });

      client.interceptors.response.use(async (response) => response);

      client.interceptors.error.use(async (error, response) => {
        if (response?.status === 401 && typeof window !== "undefined") {
          console.warn("Unauthorized request, clearing user state");

          const { useUserStore } = await import("@/stores/useUserStore");
          useUserStore.getState().logout();

          throw new Error("Unauthorized");
        }

        throw error;
      });

      interceptorsInitialized = true;
      console.log("API interceptors initialized successfully");
    })
    .catch((error) => {
      console.error("Failed to initialize API interceptors:", error);
      throw error;
    });

  return initializationPromise;
}
