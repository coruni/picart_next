"use client";

import { useClickOutside } from "@/hooks";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ReactNode, useMemo, useRef, useState } from "react";

type MenuItemConfirmDialog = {
  enabled?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  confirmDialog?: MenuItemConfirmDialog;
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
  const [confirmingItem, setConfirmingItem] = useState<MenuItem | null>(null);
  const [confirming, setConfirming] = useState(false);
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
    if (item.disabled) {
      return;
    }

    if (item.confirmDialog?.enabled) {
      setConfirmingItem(item);
      setOpen(false);
      return;
    }

    item.onClick();
    setOpen(false);
  };

  const handleConfirm = async () => {
    if (!confirmingItem) {
      return;
    }

    setConfirming(true);

    try {
      await confirmingItem.onClick();
      setConfirmingItem(null);
    } catch (error) {
      console.error("Dropdown menu confirm action failed:", error);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
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
            isOpen ? "opacity-100" : "pointer-events-none opacity-0",
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

      <Dialog
        open={Boolean(confirmingItem)}
        onOpenChange={(open) => {
          if (!open && !confirming) {
            setConfirmingItem(null);
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl p-6" showClose={false}>
          <DialogHeader className="mb-0 space-y-2 text-center sm:text-center">
            <DialogTitle>
              {confirmingItem?.confirmDialog?.title ?? t("confirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {confirmingItem?.confirmDialog?.description ??
                t("confirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-center gap-6! sm:justify-center">
            <Button
              variant="outline"
              className="h-8 min-w-20 rounded-full px-6"
              onClick={() => setConfirmingItem(null)}
              disabled={confirming}
            >
              {confirmingItem?.confirmDialog?.cancelText ?? t("cancel")}
            </Button>
            <Button
              className="h-8 min-w-20 rounded-full px-6"
              onClick={handleConfirm}
              loading={confirming}
              disabled={confirming}
            >
              {confirmingItem?.confirmDialog?.confirmText ?? t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
