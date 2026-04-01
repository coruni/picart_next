"use client";

import { GuardedLink } from "@/components/shared/GuardedLink";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";
import { ChevronRight, PenIcon } from "lucide-react";
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
      iconBg: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-300",
      iconPath: (
        <path
          d="M897.024 328.362667l-538.453333 538.453333a209.322667 209.322667 0 0 1-127.573334 60.16l-122.453333 11.52a20.906667 20.906667 0 0 1-23.04-23.04l11.52-122.453333a209.322667 209.322667 0 0 1 60.16-127.573334l538.453333-538.453333a142.421333 142.421333 0 0 1 201.386667 201.386667z"
          fill="currentColor"
        />
      ),
      iconViewBox: "0 0 1024 1024",
    },
    {
      href: "/create/image",
      label: tHeader("create.image"),
      iconBg: "bg-[#3db8f533]",
      iconColor: "",
      iconPaths: (
        <>
          <path
            d="M6.256735 237.414653C6.256735 106.250736 115.408321 0 250.041882 0h650.017886C1034.693329 0 1143.844915 106.250736 1143.844915 237.414653v435.241238C1143.844915 803.819808 1034.693329 910.070544 900.059768 910.070544H250.041882C115.408321 910.070544 6.256735 803.819808 6.256735 672.655891V237.414653z"
            fill="#DCF5F6"
          />
          <path
            d="M209.373104 514.360495a223.479198 217.620619 0 1 0 446.958396 0 223.479198 217.620619 0 1 0 -446.958396 0Z"
            fill="#04BABE"
          />
          <path
            d="M867.297228 187.133256a41.237572 41.237572 0 0 0-70.359829 0l-245.491529 414.082097a41.237572 41.237572 0 0 1-70.359829 0l-52.101538-87.821807a41.066933 41.066933 0 0 0-70.359829 0l-244.012665 411.522524c-15.584958 26.278287 3.981559 59.325224 35.265234 59.325223H290.084986c22.410487 0 40.38438 21.386658 59.154585 33.274454 6.256735 3.981559 13.764817 6.313614 22.069211 6.313615H1292.868966c31.283675 0 50.850192-32.990057 35.208354-59.325224L867.297228 187.133256z"
            fill="#B4EBED"
          />
        </>
      ),
      iconViewBox: "0 0 1493 1024",
    },
    {
      href: "/create/video",
      label: tHeader("create.video"),
      iconBg: "bg-red-100 dark:bg-red-900",
      iconColor: "",
      iconPaths: (
        <>
          <path
            d="M102.4 153.6m76.8 0l665.6 0q76.8 0 76.8 76.8l0 563.2q0 76.8-76.8 76.8l-665.6 0q-76.8 0-76.8-76.8l0-563.2q0-76.8 76.8-76.8Z"
            fill="#FF7C83"
          />
          <path
            d="M445.1072 385.0624C425.4976 373.8496 409.6 383.168 409.6 405.696v212.5824c0 22.6176 15.8976 31.8464 35.5072 20.6336l186.2784-106.624c19.6096-11.2128 19.6096-29.4016 0-40.6272l-186.2784-106.5984z"
            fill="#E05050"
          />
        </>
      ),
      iconViewBox: "0 0 1024 1024",
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
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  option.iconBg,
                )}
              >
                <svg
                  className={cn("size-5", option.iconColor)}
                  viewBox={option.iconViewBox}
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {option.iconPaths || option.iconPath}
                </svg>
              </div>
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
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            option.iconBg,
          )}
        >
          <svg
            className={cn("size-5", option.iconColor)}
            viewBox={option.iconViewBox}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            {option.iconPaths || option.iconPath}
          </svg>
        </div>
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
        <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl p-0 animate-in fade-in-0 zoom-in-95 duration-200 md:hidden">
          <div className="shrink-0 border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <PenIcon className="size-5 text-primary" />
              </div>
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
