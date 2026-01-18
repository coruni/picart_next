import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

// 创建国际化中间件
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // 执行国际化中间件
  return intlMiddleware(request);
}

export const config = {
  // 排除静态文件、API 路由和 public 目录
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
