"use client";

import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ReactNode, useMemo, useRef, useState } from "react";

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

type DropdownMenuProps = {
  trigger: ReactNode | ((state: { isOpen: boolean }) => ReactNode);
  items: MenuItem[];
  title?: string;
  position?: "left" | "right";
  className?: string;
  menuClassName?: string;
  onOpenChange?: (isOpen: boolean) => void;
};

export function DropdownMenu({
  trigger,
  items,
  title,
  position = "right",
  className,
  menuClassName,
  onOpenChange,
}: DropdownMenuProps) {
  const t = useTranslations("dropdownMenu");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const setOpen = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  useClickOutside(menuRef, () => setOpen(false));

  const resolvedTrigger = useMemo(() => {
    if (typeof trigger === "function") {
      return trigger({ isOpen });
    }

    return trigger;
  }, [isOpen, trigger]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") {
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          setOpen(!isOpen);
        }}
      >
        {resolvedTrigger}
      </div>

      <div
        className={cn(
          "absolute top-8 z-10 min-w-50 w-max rounded-xl border border-border/70 bg-card shadow-lg",
          position === "right"
            ? "right-0 origin-top-right"
            : "left-0 origin-top-left",
          isOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
          menuClassName,
        )}
        role="menu"
        aria-hidden={!isOpen}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="p-2 text-sm">
          {(title ?? t("more")) && (
            <div className="mb-1 px-2 font-medium text-foreground/80">
              <span>{title ?? t("more")}</span>
            </div>
          )}

          {items.map((item, index) => (
            <div
              key={index}
              role="menuitem"
              aria-disabled={item.disabled}
              className={cn(
                "flex items-center gap-2 rounded-xl p-2 text-sm whitespace-nowrap",
                item.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "group cursor-pointer text-black/75 hover:bg-primary/12 hover:text-primary dark:text-white/75",
                item.className,
              )}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span>{item.icon}</span>}
              <span className="whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
