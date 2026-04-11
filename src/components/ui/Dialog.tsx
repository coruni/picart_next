"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  unmountOnClose?: boolean;
}

export interface DialogContentProps {
  className?: string;
  children: ReactNode;
  showClose?: boolean;
  style?: CSSProperties;
  hideOverlay?: boolean;
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

const DIALOG_ROOT_SELECTOR = '[data-dialog-root="true"]';

function getOpenDialogRoots(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(DIALOG_ROOT_SELECTOR),
  );
}

function getTopmostDialogRoot(): HTMLElement | null {
  const roots = getOpenDialogRoots();
  return roots.length > 0 ? roots[roots.length - 1] : null;
}

function isTopmostDialog(dialogId: string): boolean {
  const topmost = getTopmostDialogRoot();
  return topmost?.dataset.dialogId === dialogId;
}

function closeDialogById(dialogId: string) {
  window.dispatchEvent(
    new CustomEvent("dialog-close", {
      detail: { dialogId },
    }),
  );
}

function closeClosestDialogFromElement(element: HTMLElement | null) {
  const dialogRoot = element?.closest<HTMLElement>(DIALOG_ROOT_SELECTOR);
  const dialogId = dialogRoot?.dataset.dialogId;
  if (!dialogId) return;

  if (!isTopmostDialog(dialogId)) return;
  closeDialogById(dialogId);
}

function isDialogOverlayElement(node: ReactNode): boolean {
  return isValidElement(node) && node.type === DialogOverlay;
}

function hasDialogOverlayInTree(node: ReactNode): boolean {
  let found = false;

  Children.forEach(node, (child) => {
    if (found) return;
    if (!isValidElement<{ children?: ReactNode }>(child)) return;

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

export function Dialog({
  open,
  onOpenChange,
  children,
  unmountOnClose = true,
}: DialogProps) {
  const reactId = useId();
  const dialogId = useMemo(() => {
    return `dialog-${reactId.replace(/[:]/g, "")}`;
  }, [reactId]);

  const hasCustomOverlay = useMemo(() => {
    return hasDialogOverlayInTree(children);
  }, [children]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      requestAnimationFrame(() => {
        const hasOtherDialogs = getOpenDialogRoots().length > 0;
        if (!hasOtherDialogs) {
          document.body.style.overflow = "";
        }
      });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!isTopmostDialog(dialogId)) return;

      onOpenChange(false);
    };

    const handleDialogClose = (e: Event) => {
      const customEvent = e as CustomEvent<{ dialogId?: string }>;
      const targetDialogId = customEvent.detail?.dialogId;
      if (!targetDialogId) return;

      if (targetDialogId === dialogId) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("dialog-close", handleDialogClose);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("dialog-close", handleDialogClose);
    };
  }, [open, onOpenChange, dialogId]);

  if (!open && unmountOnClose) {
    return null;
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <div data-dialog-root="true" data-dialog-id={dialogId} className="contents">
      {!hasCustomOverlay && <DialogOverlay />}
      {children}
    </div>,
    document.body,
  );
}

export function DialogOverlay({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.();

    if (onClick) return;

    closeClosestDialogFromElement(e.currentTarget);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 bg-black/50",
        "animate-in fade-in-0 duration-200",
        className,
      )}
      onClick={handleClick}
      aria-hidden="true"
    />
  );
}

export function DialogContent({
  className,
  children,
  showClose = true,
  style,
}: DialogContentProps) {
  return (
    <div
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

export function DialogClose({ className }: { className?: string }) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    closeClosestDialogFromElement(e.currentTarget);
  };

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
        "flex px-6 py-4 flex-col space-y-1.5 text-center sm:text-left text-sm",
        className,
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
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2",
        className,
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
        "text-sm font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
        className,
      )}
    >
      {children}
    </h2>
  );
}

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
