"use client";

import { DropdownMenu, type MenuItem } from "@/components/shared";
import { usePathname, useRouter } from "@/i18n/routing";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

type ChannelSort = "popular" | "latest";

export function ChannelSort() {
  const t = useTranslations("channelPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort: ChannelSort =
    searchParams.get("sort") === "latest" ? "latest" : "popular";

  const handleSortChange = (nextSort: ChannelSort) => {
    if (nextSort === currentSort) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sort", nextSort);
    router.replace(
      nextParams.size ? `${pathname}?${nextParams.toString()}` : pathname,
    );
  };

  const items: MenuItem[] = [
    {
      label: t("sortOptions.popular"),
      onClick: () => handleSortChange("popular"),
      className:
        currentSort === "popular"
          ? "bg-primary/10! text-primary! hover:bg-primary/10!"
          : undefined,
    },
    {
      label: t("sortOptions.latest"),
      onClick: () => handleSortChange("latest"),
      className:
        currentSort === "latest"
          ? "bg-primary/10! text-primary! hover:bg-primary/10!"
          : undefined,
    },
  ];

  return (
    <DropdownMenu
      className="shrink-0"
      position="right"
      title=""
      trigger={({ isOpen }) => (
        <button className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary outline-0 border-border border rounded-md  p-1">
          <span>{t(`sortOptions.${currentSort}`)}</span>
          <ChevronDown
            className={`size-4 transition-transform  ease-out ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
      items={items}
      menuClassName="top-9 min-w-28 rounded-xl border border-border bg-card drop-shadow-lg"
    />
  );
}
