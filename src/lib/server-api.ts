import * as api from "@/api";
import { buildAuthHeaders } from "@/lib/request-auth";

type ApiModule = typeof api;
type ApiMethod = (options?: Record<string, unknown>) => Promise<unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function withServerAuth<T extends ApiMethod>(
  fn: T,
  options?: Parameters<T>[0]
): Promise<Awaited<ReturnType<T>>> {
  const requestOptions: Record<string, unknown> = isPlainObject(options)
    ? options
    : {};
  const headers = await buildAuthHeaders(requestOptions.headers as HeadersInit);

  return (await fn({
    ...requestOptions,
    headers,
  })) as Awaited<ReturnType<T>>;
}

export const serverApi = new Proxy(api, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    if (typeof value !== "function") {
      return value;
    }

    return (options?: Record<string, unknown>) =>
      withServerAuth(value as ApiMethod, options);
  },
}) as {
  [K in keyof ApiModule]: ApiModule[K] extends ApiMethod
    ? (
        options?: Parameters<ApiModule[K]>[0]
      ) => Promise<Awaited<ReturnType<ApiModule[K]>>>
    : ApiModule[K];
};
