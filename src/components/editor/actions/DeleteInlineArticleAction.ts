import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";

export class DeleteInlineArticleAction extends Action {
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
    const list = this.formatter.currentSpec?.getTargetElement() as
      | HTMLElement
      | undefined;
    if (!list) return;

    // 找到 blot
    const blot = this.formatter.quill.scroll.find(list);
    if (blot) {
      const index = this.formatter.quill.getIndex(blot);
      this.formatter.quill.deleteText(index, 1, "user");
    }

    this.formatter.hide();
  };
}
