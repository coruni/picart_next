"use client";

import { cn } from "@/lib";
import type { ReactNode } from "react";

/**
 * 通用悬停提示组件
 *
 * 用法：
 * <Tooltip content="提示文案">
 *   <span>触发元素</span>
 * </Tooltip>
 *
 * @property {ReactNode} content - 提示内容
 * @property {"top" | "bottom" | "left" | "right"} [position="bottom"] - 提示位置
 * @property {ReactNode} children - 触发提示的元素
 * @property {string} [className] - 外层容器样式
 * @property {string} [contentClassName] - 提示内容样式
 */
type TooltipProps = {
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

type TooltipPosition = NonNullable<TooltipProps["position"]>;

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 mb-2.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-2.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-2.5 -translate-y-1/2",
};

/** 三角小尾巴：箭头始终指向触发元素 */
const arrowClasses: Record<TooltipPosition, string> = {
  top: "left-1/2 top-full -translate-x-1/2 border-x-4 border-x-transparent border-t-[4px] border-t-black/80",
  bottom:
    "left-1/2 bottom-full -translate-x-1/2 border-x-4 border-x-transparent border-b-[4px] border-b-black/80",
  left: "right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-l-[4px] border-l-black/80",
  right:
    "left-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-[4px] border-r-black/80",
};

export const Tooltip = ({
  content,
  position = "bottom",
  children,
  className,
  contentClassName,
}: TooltipProps) => {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none invisible absolute z-50 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100",
          positionClasses[position],
          contentClassName,
        )}
      >
        {content}
        <span className={cn("absolute size-0", arrowClasses[position])} />
      </span>
    </span>
  );
};
