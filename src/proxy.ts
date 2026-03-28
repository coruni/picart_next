import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  DEVICE_ID_COOKIE_MAX_AGE,
  DEVICE_ID_COOKIE_NAME,
  generateDeviceId,
} from "./lib/request-auth";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  if (!request.cookies.get(DEVICE_ID_COOKIE_NAME)?.value) {
    response.cookies.set(DEVICE_ID_COOKIE_NAME, generateDeviceId(), {
      maxAge: DEVICE_ID_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)).*)",
  ],
};
