"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// Global stack to track nested dialogs
const dialogStack: string[] = [];

/**
 * 对话框组件属性接口
 * @interface DialogProps
 *
 * @property {boolean} open - 对话框是否打开
 * @property {(open: boolean) => void} onOpenChange - 对话框开关状态变化回调
 * @property {ReactNode} children - 对话框内容
 * @property {boolean} [unmountOnClose=true] - 关闭时是否卸载组件
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  unmountOnClose?: boolean; // 关闭时是否卸载组件，默认 true
}

/**
 * 对话框内容组件属性接口
 * @interface DialogContentProps
 *
 * @property {string} [className] - 自定义样式类名
 * @property {ReactNode} children - 内容
 * @property {boolean} [showClose] - 是否显示关闭按钮
 */
export interface DialogContentProps {
  className?: string;
  children: ReactNode;
  showClose?: boolean;
  style?: CSSProperties;
  hideOverlay?: boolean; // 兼容旧参数，当前实现中不再使用
}

/**
 * 对话框头部组件属性接口
 * @interface DialogHeaderProps
 *
 * @property {string} [className] - 自定义样式类名
 * @property {ReactNode} children - 头部内容
 */
export interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
}

/**
 * 对话框底部组件属性接口
 * @interface DialogFooterProps
 *
 * @property {string} [className] - 自定义样式类名
 * @property {ReactNode} children - 底部内容
 */
export interface DialogFooterProps {
  className?: string;
  children: ReactNode;
}

/**
 * 对话框标题组件属性接口
 * @interface DialogTitleProps
 *
 * @property {string} [className] - 自定义样式类名
 * @property {ReactNode} children - 标题内容
 */
export interface DialogTitleProps {
  className?: string;
  children: ReactNode;
}

/**
 * 对话框描述组件属性接口
 * @interface DialogDescriptionProps
 *
 * @property {string} [className] - 自定义样式类名
 * @property {ReactNode} children - 描述内容
 */
export interface DialogDescriptionProps {
  className?: string;
  children: ReactNode;
}

function isDialogOverlayElement(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  return node.type === DialogOverlay;
}

function hasDialogOverlayInTree(node: ReactNode): boolean {
  let found = false;

  Children.forEach(node, (child) => {
    if (found || !isValidElement<{ children?: ReactNode }>(child)) return;

    if (child.type === DialogOverlay) {
      found = true;
      return;
    }

    if (child.props.children) {
      found = hasDialogOverlayInTree(child.props.children);
    }
  });

  return found;
}

function dispatchDialogClose() {
  const currentDialogId = document.body.getAttribute("data-dialog-open");
  const event = new CustomEvent("dialog-close", {
    detail: { dialogId: currentDialogId },
  });
  window.dispatchEvent(event);
}

/**
 * 对话框组件
 * @component
 *
 * 模态对话框组件，支持遮罩层、ESC 关闭、点击外部关闭等能力
 */
export function Dialog({
  open,
  onOpenChange,
  children,
  unmountOnClose = true,
}: DialogProps) {
  const dialogIdRef = useRef(
    `dialog-${Math.random().toString(36).substring(2, 9)}`,
  );

  const hasCustomOverlay = useMemo(() => {
    return hasDialogOverlayInTree(children);
  }, [children]);

  useEffect(() => {
    const dialogId = dialogIdRef.current;

    if (open) {
      // Add to stack and lock body
      dialogStack.push(dialogId);
      document.body.style.overflow = "hidden";
      document.body.setAttribute("data-dialog-open", dialogId);
    } else {
      // Remove from stack
      const index = dialogStack.indexOf(dialogId);
      if (index > -1) {
        dialogStack.splice(index, 1);
      }

      // Only restore body if this dialog is the one that set it
      const currentDialogId = document.body.getAttribute("data-dialog-open");
      if (currentDialogId === dialogId) {
        // If there are other dialogs in stack, transfer to the next one
        if (dialogStack.length > 0) {
          const nextDialogId = dialogStack[dialogStack.length - 1];
          document.body.setAttribute("data-dialog-open", nextDialogId);
        } else {
          document.body.style.overflow = "";
          document.body.removeAttribute("data-dialog-open");
        }
      }
    }

    return () => {
      // Cleanup: remove from stack if still present
      const index = dialogStack.indexOf(dialogId);
      if (index > -1) {
        dialogStack.splice(index, 1);
      }

      // Restore body if this dialog is the one that set it
      const currentDialogId = document.body.getAttribute("data-dialog-open");
      if (currentDialogId === dialogId) {
        if (dialogStack.length > 0) {
          const nextDialogId = dialogStack[dialogStack.length - 1];
          document.body.setAttribute("data-dialog-open", nextDialogId);
        } else {
          document.body.style.overflow = "";
          document.body.removeAttribute("data-dialog-open");
        }
      }
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        // Only the topmost dialog responds to ESC
        const topDialogId = dialogStack[dialogStack.length - 1];
        if (topDialogId === dialogIdRef.current) {
          onOpenChange(false);
        }
      }
    };

    const handleDialogClose = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.dialogId === dialogIdRef.current && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("dialog-close", handleDialogClose);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("dialog-close", handleDialogClose);
    };
  }, [open, onOpenChange]);

  if (!open && unmountOnClose) {
    return null;
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <>
      {!hasCustomOverlay && <DialogOverlay onClick={dispatchDialogClose} />}
      {children}
    </>,
    document.body,
  );
}

/**
 * 对话框遮罩层组件
 * @component
 *
 * 显示半透明黑色遮罩层，点击时可关闭对话框
 */
export function DialogOverlay({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-100 bg-black/50",
        "animate-in fade-in-0 duration-200",
        className,
      )}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

/**
 * 对话框内容容器组件
 * @component
 *
 * 对话框的主要内容区域，包含背景、圆角、阴影等样式
 */
export function DialogContent({
  className,
  children,
  showClose = true,
  style,
}: DialogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={contentRef}
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed left-[50%] top-[50%] z-101 w-full max-w-lg",
        "translate-x-[-50%] translate-y-[-50%]",
        "rounded-lg border bg-card border-border p-6 shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className,
      )}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      {showClose && <DialogClose />}
    </div>
  );
}

/**
 * 对话框关闭按钮组件
 * @component
 *
 * 显示在对话框右上角的 X 关闭按钮
 */
export function DialogClose({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 cursor-pointer",
        "text-gray-500 transition-opacity hover:text-gray-900 hover:opacity-100 dark:text-gray-400 dark:hover:text-gray-100",
        "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
        "disabled:pointer-events-none",
        className,
      )}
      onClick={dispatchDialogClose}
      aria-label="Close dialog"
    >
      <X className="h-6 w-6" />
      <span className="sr-only">Close</span>
    </button>
  );
}

/**
 * 对话框头部组件
 * @component
 *
 * 用于包裹对话框标题和描述
 */
export function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div
      className={cn(
        "flex px-6 py-4 flex-col space-y-1.5 text-center sm:text-left text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 对话框底部组件
 * @component
 *
 * 用于包裹对话框底部操作按钮
 */
export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 对话框标题组件
 * @component
 *
 * 显示对话框标题文本
 */
export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2
      className={cn(
        "text-sm font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/**
 * 对话框描述组件
 * @component
 *
 * 显示对话框描述文本
 */
export function DialogDescription({
  className,
  children,
}: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>
      {children}
    </p>
  );
}
