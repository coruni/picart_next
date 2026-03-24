import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";

export class RemoveLinkAction extends Action {
  constructor(formatter: BlotFormatter) {
    super(formatter);
    this.toolbarButtons = [
      new ToolbarButton(
        "remove-link",
        this.onClickHandler,
        this.formatter.options.toolbar,
      ),
    ];
  }

  onClickHandler: EventListener = () => {
    const link = this.formatter.currentSpec?.getTargetElement() as HTMLAnchorElement;
    if (!link) return;

    // 找到 link 在 Quill 中的位置
    const blot = this.formatter.quill.scroll.find(link);
    if (blot) {
      const index = this.formatter.quill.getIndex(blot);
      const length = blot.length();
      // 移除链接格式（保留文字）
      this.formatter.quill.formatText(index, length, "link", false, "user");
    }

    this.formatter.hide();
  };
}