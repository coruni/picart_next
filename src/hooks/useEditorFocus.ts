"use client";

import Quill from "quill";
import { useCallback, useRef } from "react";

interface FocusState {
  index: number;
  length: number;
}

/**
 * 编辑器焦点管理 Hook
 * 用于在打开对话框等操作时保持编辑器焦点
 */
export function useEditorFocus(quillRef: React.MutableRefObject<Quill | null>) {
  const savedSelection = useRef<FocusState | null>(null);

  /**
   * 保存当前光标位置
   */
  const saveSelection = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true);
    if (range) {
      savedSelection.current = { index: range.index, length: range.length };
    }
  }, [quillRef]);

  /**
   * 恢复编辑器焦点
   */
  const restoreFocus = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;

    // 使用 requestAnimationFrame 确保在 DOM 更新后恢复焦点
    requestAnimationFrame(() => {
      quill.focus();
      if (savedSelection.current) {
        quill.setSelection(savedSelection.current.index, savedSelection.current.length);
      }
    });
  }, [quillRef]);

  /**
   * 准备打开对话框
   * 保存当前选区
   */
  const prepareDialogOpen = useCallback(() => {
    saveSelection();
  }, [saveSelection]);

  /**
   * 处理对话框关闭
   * 1. 恢复焦点
   * 2. 清除保存的选区
   */
  const handleDialogClose = useCallback(() => {
    restoreFocus();
    savedSelection.current = null;
  }, [restoreFocus]);

  return {
    savedSelection,
    saveSelection,
    restoreFocus,
    prepareDialogOpen,
    handleDialogClose,
  };
}
