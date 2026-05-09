import type BlotFormatter from "@enzedonline/quill-blot-formatter2";
import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import Quill from "quill";

export class CopyAction extends Action {
  constructor(formatter: BlotFormatter) {
    super(formatter);
    this.toolbarButtons = [
      new ToolbarButton(
        "copy",
        this.onClickHandler,
        this.formatter.options.toolbar,
      ),
    ];

    // 监听粘贴事件，优先使用内部存储的 Delta
    this.formatter.quill
      .getModule("clipboard")
      ?.quill?.root?.addEventListener("paste", this.onPasteHandler, true);
  }

  onClickHandler: EventListener = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    const blot = this.formatter.currentSpec?.getTargetBlot();
    if (!blot) {
      console.warn("[CopyAction] 未找到 target blot");
      return;
    }

    const quill = this.formatter.quill;
    const index = quill.getIndex(blot);
    const delta = quill.getContents(index, 1);

    // 存储 Delta 供内部粘贴使用
    (window as any).__quillClipboardImage = {
      delta,
      timestamp: Date.now(),
    };

    // 同时尝试写入系统剪贴板（失败也不影响内部粘贴）
    const targetElement = this.formatter.currentSpec?.getTargetElement();
    const img =
      (targetElement?.querySelector("img.ql-image") as HTMLImageElement) ??
      (targetElement?.tagName === "IMG" ? (targetElement as HTMLImageElement) : null);

    if (img?.src) {
      const html = `<img src="${img.src}">`;
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([img.src], { type: "text/plain" }),
          }),
        ])
        .catch(() => navigator.clipboard.writeText(img.src).catch(() => {}));
    }

    // 视觉反馈：短暂改变按钮样式
    const btn = (e.currentTarget ?? e.target) as HTMLElement;
    btn?.classList.add("ql-blot-formatter-copy-success");
    setTimeout(() => btn?.classList.remove("ql-blot-formatter-copy-success"), 600);
  };

  // 拦截粘贴：如果有内部存储的 Delta 且在 2s 内，直接插入
  private onPasteHandler = (e: ClipboardEvent) => {
    const stored = (window as any).__quillClipboardImage;
    if (!stored) return;

    const age = Date.now() - stored.timestamp;
    if (age > 2000) {
      (window as any).__quillClipboardImage = null;
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const quill = this.formatter.quill;
    const range = quill.getSelection(true);
    const insertIndex = range ? range.index : quill.getLength();

    quill.updateContents(
      new (Quill.import("delta") as any)()
        .retain(insertIndex)
        .concat(stored.delta),
      "user",
    );

    quill.setSelection(insertIndex + 1, 0);
    (window as any).__quillClipboardImage = null;
  };
}