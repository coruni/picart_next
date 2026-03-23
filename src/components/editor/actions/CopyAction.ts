import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";

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
  }

  onClickHandler: EventListener = () => {
    const blot = this.formatter.currentSpec?.getTargetBlot();
    if (!blot) return;

    const quill = this.formatter.quill;
    const index = quill.getIndex(blot);

    // 选中图片 blot
    quill.setSelection(index, 1);

    // 触发复制操作
    const delta = quill.getContents(index, 1);

    // 将 Delta 存储到全局变量，供粘贴时使用
    (window as any).__quillClipboardImage = delta;

    // 同时复制到剪贴板（HTML 格式）
    const img = this.formatter.currentSpec?.getTargetElement() as HTMLImageElement;
    if (img) {
      const html = `<img src="${img.src}">`;
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([img.src], { type: "text/plain" }),
        }),
      ]).catch(() => {
        // 如果剪贴板 API 失败，使用备用方案
        navigator.clipboard.writeText(img.src).catch(() => {});
      });
    }
  };
}