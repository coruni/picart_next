import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

const DEFAULT_LOCALE = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "zh") as "zh" | "en";

export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
