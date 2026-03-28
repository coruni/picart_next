"use client";

import { ReactNode, useRef, useState } from "react";
import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

      {isOpen && (
        <div
          className={cn(
            "absolute top-8 rounded-xl drop-shadow-xl bg-card min-w-50 z-10",
            position === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="p-2">
            {(title ?? t("more")) && (
              <div className="px-2 font-medium mb-1">
                <span>{title ?? t("more")}</span>
              </div>
            )}

            {items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "cursor-pointer p-2 text-sm rounded-xl flex items-center gap-2 transition-colors",
                  item.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary/15 group hover:text-primary",
                  item.className,
                )}
                onClick={() => handleItemClick(item)}
              >
                {item.icon && (
                  <span className="text-secondary group-hover:text-primary">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

