/**
 * 服务端 Cookie 工具函数
 * 用于 Next.js Server Components 和 Server Actions
 */
import { cookies } from "next/headers";

/**
 * 获取服务端 cookie
 */
export async function getServerCookie(name: string): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(name);
  return cookie?.value || null;
}

/**
 * 设置服务端 cookie
 */
export async function setServerCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "strict" | "lax" | "none";
  }
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(name, value, options);
}

/**
 * 删除服务端 cookie
 */
export async function deleteServerCookie(name: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}
