"use client";

import { GuardedLink } from "@/components/shared/GuardedLink";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";
import { ChevronRight, Image, PenIcon, PenLine, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface CreateDropdownProps {
  isTransparentBgPage?: boolean;
  scrolled?: boolean;
  actionButtonClassName?: string;
}

export function CreateDropdown({
  isTransparentBgPage = false,
  scrolled = false,
  actionButtonClassName,
}: CreateDropdownProps) {
  const tHeader = useTranslations("header");
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const defaultActionButtonClassName = cn(
    "flex items-center justify-center rounded-full p-2 transition-colors",
    "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
    "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
    isTransparentBgPage && !scrolled && "text-white",
  );

  const buttonClassName = actionButtonClassName || defaultActionButtonClassName;

  const createOptions = [
    {
      href: "/create/post",
      label: tHeader("create.article"),
      Icon: PenLine,
    },
    {
      href: "/create/image",
      label: tHeader("create.image"),
      Icon: Image,
    },
    {
      href: "/create/video",
      label: tHeader("create.video"),
      Icon: Video,
    },
  ];

  const renderDesktopMenu = () => (
    <div className="invisible absolute right-0 z-50 w-auto min-w-xs pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
      <div className="rounded-xl border border-border bg-card shadow-lg">
        <div className="space-y-2 p-3">
          {createOptions.map((option) => (
            <GuardedLink
              key={option.href}
              href={option.href}
              className="group/item flex items-center gap-3 rounded-lg px-4 py-2 whitespace-nowrap transition-colors hover:bg-primary/15 text-muted-foreground hover:text-primary dark:bg-[#242734]"
            >
              <option.Icon className="size-5 shrink-0 text-gray-500" />
              <span className="flex-1 text-sm font-medium">{option.label}</span>
              <ChevronRight className="size-4 transition-colors" />
            </GuardedLink>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMobileMenuItem = (option: (typeof createOptions)[0]) => (
    <GuardedLink
      key={option.href}
      href={option.href}
      onClick={closeMobileMenu}
      className="mb-1 flex h-12 items-center justify-between rounded-lg px-3 text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
    >
      <div className="flex items-center gap-3">
        <option.Icon className="size-5 shrink-0 text-gray-500" />
        <span className="text-sm font-medium">{option.label}</span>
      </div>
      <ChevronRight className="size-4" />
    </GuardedLink>
  );

  return (
    <>
      <div className="relative group">
        <button
          type="button"
          onClick={() => isMobile && setMobileMenuOpen(true)}
          className={buttonClassName}
        >
          <PenIcon className="size-5" />
        </button>

        {/* Desktop hover menu */}
        {!isMobile && renderDesktopMenu()}
      </div>

      {/* Mobile dialog menu */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden rounded-2xl p-0 animate-in fade-in-0 zoom-in-95 duration-200 md:hidden">
          <div className="shrink-0 border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <PenIcon className="size-5 shrink-0 text-gray-500" />
              <div className="min-w-0">
                <div className="font-semibold text-foreground">
                  {tHeader("create.title")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {tHeader("create.subtitle")}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="p-1">{createOptions.map(renderMobileMenuItem)}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
