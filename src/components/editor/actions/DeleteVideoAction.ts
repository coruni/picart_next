import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";

export class DeleteVideoAction extends Action {
  constructor(formatter: BlotFormatter) {
    super(formatter);
    this.toolbarButtons = [
      new ToolbarButton(
        "delete",
        this.onClickHandler,
        this.formatter.options.toolbar,
      ),
    ];
  }

  onClickHandler: EventListener = () => {
    const wrapper = this.formatter.currentSpec?.getTargetElement() as HTMLElement;
    if (!wrapper) return;

    // 找到 video blot 在 Quill 中的位置
    const blot = this.formatter.quill.scroll.find(wrapper);
    if (blot) {
      const index = this.formatter.quill.getIndex(blot);
      this.formatter.quill.deleteText(index, 1, "user");
    }

    this.formatter.hide();
  };
}
