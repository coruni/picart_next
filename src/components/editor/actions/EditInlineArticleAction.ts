import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";

export class EditInlineArticleAction extends Action {
  constructor(formatter: BlotFormatter) {
    super(formatter);
    this.toolbarButtons = [
      new ToolbarButton(
        "edit-link",
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
    if (!blot) return;

    const index = this.formatter.quill.getIndex(blot);

    // 从 data-articles 读取数据
    let articlesData;
    try {
      articlesData = JSON.parse(list.dataset.articles || "[]");
    } catch {
      articlesData = [];
    }

    // 触发编辑事件，让 Editor 组件处理
    const event = new CustomEvent("inline-article-edit", {
      detail: {
        index,
        articles: articlesData,
      },
      bubbles: true,
    });

    document.dispatchEvent(event);
    this.formatter.hide();
  };
}
