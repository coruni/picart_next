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

    // 获取图片元素的 src，targetElement 是 .ql-image-wrapper
    const targetElement = this.formatter.currentSpec?.getTargetElement();
    if (targetElement) {
      const img = targetElement.querySelector("img.ql-image") as HTMLImageElement | null;
      if (img) {
        const html = `<img src="${img.src}">`;
        navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([img.src], { type: "text/plain" }),
          }),
        ]).catch(() => {
          navigator.clipboard.writeText(img.src).catch(() => {});
        });
      }
    }
  };
}