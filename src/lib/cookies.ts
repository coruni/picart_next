/**
 * Cookie 工具函数
 */

interface CookieOptions {
  path?: string;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * 设置 cookie
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === "undefined") return;

  const {
    path = "/",
    expires,
    maxAge,
    domain,
    secure,
    sameSite = "Lax",
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (path) cookieString += `; path=${path}`;
  if (expires) cookieString += `; expires=${expires.toUTCString()}`;
  if (maxAge) cookieString += `; max-age=${maxAge}`;
  if (domain) cookieString += `; domain=${domain}`;
  if (secure) cookieString += "; secure";
  if (sameSite) cookieString += `; SameSite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * 获取 cookie
 * 支持客户端和服务端（通过传入 cookie 字符串）
 */
export function getCookie(name: string, cookieString?: string): string | null {
  // 服务端：使用传入的 cookie 字符串
  if (cookieString) {
    const cookies = cookieString.split("; ");
    const cookie = cookies.find((c) => c.startsWith(`${name}=`));
    if (!cookie) return null;
    const value = cookie.substring(name.length + 1);
    return decodeURIComponent(value);
  }

  // 客户端：使用 document.cookie
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  if (!cookie) return null;

  const value = cookie.substring(name.length + 1);
  return decodeURIComponent(value);
}

/**
 * 删除 cookie
 * 尝试多种参数组合以确保删除成功
 */
export function removeCookie(name: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;
  console.log(123)
  const { path = "/", domain, sameSite } = options;
  const encodedName = encodeURIComponent(name);
  
  // 尝试多种组合删除 cookie
  const pathsToTry = [path, "/", ""];
  const domainsToTry = domain ? [domain, ""] : [""];
  
  pathsToTry.forEach(p => {
    domainsToTry.forEach(d => {
      // 使用 expires
      let cookieStr = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
      if (p) cookieStr += `; path=${p}`;
      if (d) cookieStr += `; domain=${d}`;
      if (sameSite) cookieStr += `; SameSite=${sameSite}`;
      document.cookie = cookieStr;
    });
  });
}

/**
 * 检查 cookie 是否存在
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}
