import { getCookie, setCookie } from "@/lib/cookies";

export const TOKEN_COOKIE_NAME = "auth-token";
export const DEVICE_ID_COOKIE_NAME = "device_fingerprint";
export const DEVICE_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

export function generateDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function persistClientDeviceId(deviceId: string): void {
  if (typeof window === "undefined" || !deviceId) {
    return;
  }

  setCookie(DEVICE_ID_COOKIE_NAME, deviceId, {
    maxAge: DEVICE_ID_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "Lax",
    secure: window.location.protocol === "https:",
  });
}

async function getClientToken(): Promise<string | null> {
  const { useUserStore } = await import("@/stores/useUserStore");
  const storeToken = useUserStore.getState().token;
  return storeToken || getCookie(TOKEN_COOKIE_NAME);
}

async function getClientDeviceId(): Promise<string | null> {
  const { useDeviceStore } = await import("@/stores/useDeviceStore");
  const store = useDeviceStore.getState();

  if (store.deviceId) {
    persistClientDeviceId(store.deviceId);
    return store.deviceId;
  }

  const cookieDeviceId = getCookie(DEVICE_ID_COOKIE_NAME);
  if (cookieDeviceId) {
    store.setDeviceId(cookieDeviceId);
    return cookieDeviceId;
  }

  return null;
}

async function getServerCookieValue(name: string): Promise<string | null> {
  const { getServerCookie } = await import("@/lib/server-cookies");
  return getServerCookie(name);
}

function headersToObject(init?: HeadersInit): Record<string, string> {
  if (!init) {
    return {};
  }

  if (init instanceof Headers) {
    return Object.fromEntries(init.entries());
  }

  if (Array.isArray(init)) {
    return Object.fromEntries(init);
  }

  return Object.entries(init).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = String(value);
    }
    return acc;
  }, {});
}

function deleteHeaderCaseInsensitive(
  headers: Record<string, string>,
  targetName: string
) {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === targetName.toLowerCase()) {
      delete headers[key];
    }
  }
}

export async function getRequestAuthState(): Promise<{
  token: string | null;
  deviceId: string | null;
}> {
  if (typeof window !== "undefined") {
    const [token, deviceId] = await Promise.all([
      getClientToken(),
      getClientDeviceId(),
    ]);

    return { token, deviceId };
  }

  const [token, deviceId] = await Promise.all([
    getServerCookieValue(TOKEN_COOKIE_NAME),
    getServerCookieValue(DEVICE_ID_COOKIE_NAME),
  ]);

  return { token, deviceId };
}

export async function buildAuthHeaders(
  init?: HeadersInit
): Promise<Record<string, string>> {
  const headers = headersToObject(init);
  const { token, deviceId } = await getRequestAuthState();

  deleteHeaderCaseInsensitive(headers, "Authorization");
  deleteHeaderCaseInsensitive(headers, "Device-Id");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (deviceId) {
    headers["Device-Id"] = deviceId;
  }

  return headers;
}

export function getAuthDebugSnapshot(headers?: HeadersInit) {
  const resolvedHeaders = new Headers(headers);
  const authorizationHeader = resolvedHeaders.get("Authorization");
  const deviceIdHeader = resolvedHeaders.get("Device-Id");

  return {
    hasAuthorization: !!authorizationHeader,
    authorizationPreview: authorizationHeader
      ? `${authorizationHeader.slice(0, 20)}...`
      : null,
    hasDeviceId: !!deviceIdHeader,
    deviceIdHeader,
  };
}

export function getExplicitAuthHeaders(headers?: HeadersInit) {
  const resolvedHeaders = new Headers(headers);

  return {
    Authorization: resolvedHeaders.get("Authorization"),
    "Device-Id": resolvedHeaders.get("Device-Id"),
  };
}
