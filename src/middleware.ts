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
  matcher: ["/", "/(zh|en)/:path*"],
};
