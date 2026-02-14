"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 对话框组件属性接口
 * @interface DialogProps
 * 
 * @property {boolean} open - 对话框是否打开
 * @property {(open: boolean) => void} onOpenChange - 对话框打开状态变化回调
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

/**
 * 对话框组件
 * @component
 * 
 * 模态对话框组件，支持遮罩层、ESC 键关闭、点击外部关闭等功能
 * 
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * 
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>标题</DialogTitle>
 *       <DialogDescription>描述文本</DialogDescription>
 *     </DialogHeader>
 *     <div>对话框内容</div>
 *     <DialogFooter>
 *       <Button onClick={() => setOpen(false)}>关闭</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export function Dialog({ open, onOpenChange, children, unmountOnClose = true }: DialogProps) {
  const dialogIdRef = useRef(`dialog-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.setAttribute('data-dialog-open', dialogIdRef.current);
    } else {
      // 只有当前 dialog 关闭时才恢复滚动
      const currentDialogId = document.body.getAttribute('data-dialog-open');
      if (currentDialogId === dialogIdRef.current) {
        document.body.style.overflow = "";
        document.body.removeAttribute('data-dialog-open');
      }
    }

    return () => {
      // 清理时检查是否是当前 dialog
      const currentDialogId = document.body.getAttribute('data-dialog-open');
      if (currentDialogId === dialogIdRef.current) {
        document.body.style.overflow = "";
        document.body.removeAttribute('data-dialog-open');
      }
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    const handleDialogClose = () => {
      onOpenChange(false);
    };

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("dialog-close", handleDialogClose);
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("dialog-close", handleDialogClose);
    };
  }, [open, onOpenChange]);

  // 关闭时卸载组件
  if (!open && unmountOnClose) {
    return null;
  }

  // 关闭时不卸载，只是不渲染
  if (!open) {
    return null;
  }

  return createPortal(children, document.body);
}

/**
 * 对话框遮罩层组件
 * @component
 * 
 * 显示半透明黑色遮罩层，点击时可关闭对话框
 */
export function DialogOverlay({ 
  className, 
  onClick 
}: { 
  className?: string; 
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        "animate-in fade-in-0 duration-200",
        className
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
 * 对话框的主要内容区域，包含白色背景、圆角、阴影等样式
 */
export function DialogContent({ 
  className, 
  children, 
  showClose = true 
}: DialogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = () => {
    const event = new CustomEvent("dialog-close");
    window.dispatchEvent(event);
  };

  return (
    <>
      <DialogOverlay onClick={handleOverlayClick} />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-full max-w-lg",
          "translate-x-[-50%] translate-y-[-50%]",
          "bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800",
          "p-6 animate-in fade-in-0 zoom-in-95 duration-200",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {showClose && <DialogClose />}
      </div>
    </>
  );
}

/**
 * 对话框关闭按钮组件
 * @component
 * 
 * 显示在对话框右上角的 X 关闭按钮
 */
export function DialogClose({ className }: { className?: string }) {
  const handleClick = () => {
    const event = new CustomEvent("dialog-close");
    window.dispatchEvent(event);
  };

  return (
    <button
      type="button"
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 cursor-pointer",
        "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
        "transition-opacity hover:opacity-100",
        "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
        "disabled:pointer-events-none",
        className
      )}
      onClick={handleClick}
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
        "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
        className
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
 * 用于包裹对话框底部的操作按钮
 */
export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 mt-6",
        className
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
 * 显示对话框的标题文本
 */
export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        "text-gray-900 dark:text-gray-100",
        className
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
 * 显示对话框的描述文本
 */
export function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <p
      className={cn(
        "text-sm text-gray-500 dark:text-gray-400",
        className
      )}
    >
      {children}
    </p>
  );
}
