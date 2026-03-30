"use client";

import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ReactNode, useRef, useState } from "react";

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

type DropdownMenuProps = {
  trigger: ReactNode;
  items: MenuItem[];
  title?: string;
  position?: "left" | "right";
  className?: string;
  menuClassName?: string;
};

export function DropdownMenu({
  trigger,
  items,
  title,
  position = "right",
  className,
  menuClassName,
}: DropdownMenuProps) {
  const t = useTranslations("dropdownMenu");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {trigger}
      </div>

      <div
        className={cn(
          "absolute top-8 z-8 min-w-50 w-max origin-top rounded-xl bg-card border-border drop-shadow-2xl will-change-[opacity,transform] transform-gpu transition-[opacity,transform] duration-120 ease-out",
          position === "right" ? "right-0" : "left-0",
          isOpen
            ? "visible scale-100 opacity-100"
            : "invisible pointer-events-none scale-70 opacity-0",
          menuClassName,
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="p-2 text-sm ">
          {(title ?? t("more")) && (
            <div className="mb-1 px-2 font-medium">
              <span>{title ?? t("more")}</span>
            </div>
          )}

          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 rounded-xl p-2 text-sm whitespace-nowrap transition-colors",
                item.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "group cursor-pointer hover:bg-primary/15 hover:text-primary text-black/75 dark:text-white/75",
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
