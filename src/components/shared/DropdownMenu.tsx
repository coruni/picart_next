"use client";

import { ReactNode, useRef, useState } from "react";
import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

type DropdownMenuProps = {
  /**
   * 触发按钮
   */
  trigger: ReactNode;
  /**
   * 菜单项
   */
  items: MenuItem[];
  /**
   * 菜单标题
   */
  title?: string;
  /**
   * 菜单位置
   */
  position?: "left" | "right";
  /**
   * 容器类名
   */
  className?: string;
  /**
   * 菜单类名
   */
  menuClassName?: string;
};

export function DropdownMenu({
  trigger,
  items,
  title = "更多",
  position = "right",
  className,
  menuClassName,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useClickOutside(menuRef, () => setIsOpen(false));

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      {/* 触发按钮 */}
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-8 rounded-xl drop-shadow-xl bg-card min-w-50 z-10",
            position === "right" ? "right-0" : "left-0",
            menuClassName
          )}
        >
          <div className="p-2">
            {/* 标题 */}
            {title && (
              <div className="px-2 font-medium mb-1">
                <span>{title}</span>
              </div>
            )}

            {/* 菜单项 */}
            {items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "cursor-pointer p-2 text-sm rounded-xl flex items-center gap-2 transition-colors",
                  item.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary/15 group hover:text-primary",
                  item.className
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
