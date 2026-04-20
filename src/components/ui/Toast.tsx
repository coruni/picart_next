"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastOptions {
  duration?: number;
  onClose?: () => void;
}

interface ToastState {
  message: string;
  visible: boolean;
}

let showToastFn: ((message: string, options?: ToastOptions) => void) | null = null;

export function showToast(message: string, options?: ToastOptions) {
  showToastFn?.(message, options);
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToastLocal = useCallback((message: string, options?: ToastOptions) => {
    setToast({ message, visible: true });

    const duration = options?.duration ?? 2000;

    setTimeout(() => {
      hideToast();
      options?.onClose?.();
    }, duration);
  }, [hideToast]);

  useEffect(() => {
    showToastFn = showToastLocal;
    return () => {
      showToastFn = null;
    };
  }, [showToastLocal]);

  if (!isMounted || !toast.visible) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      <div className="bg-black/70 text-white px-6 py-3 rounded-md text-sm">
        {toast.message}
      </div>
    </div>,
    document.body
  );
}
