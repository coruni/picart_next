export const PROTECTED_PREFIXES = [
  "/create",
  "/message",
  "/messages",
  "/profile",
  "/setting",
];

export function isProtectedPath(pathname: string) {
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /^\/account\/[^/]+\/(edit|decoration)(\/|$)/.test(pathname);
}

type HrefLike =
  | string
  | {
      pathname?: string | null;
    }
  | null
  | undefined;

export function getPathFromHref(href: HrefLike) {
  if (typeof href === "string") {
    return href.split("?")[0]?.split("#")[0] || "";
  }

  if (href && typeof href === "object" && "pathname" in href) {
    return typeof href.pathname === "string" ? href.pathname : "";
  }

  return "";
}

export function requiresAuthForHref(href: HrefLike) {
  const path = getPathFromHref(href);
  return path ? isProtectedPath(path) : false;
}
