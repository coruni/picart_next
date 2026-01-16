"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  unmountOnClose?: boolean; // 关闭时是否卸载组件，默认 true
}

export interface DialogContentProps {
  className?: string;
  children: ReactNode;
  showClose?: boolean;
}

export interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
}

export interface DialogFooterProps {
  className?: string;
  children: ReactNode;
}

export interface DialogTitleProps {
  className?: string;
  children: ReactNode;
}

export interface DialogDescriptionProps {
  className?: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children, unmountOnClose = true }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
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
