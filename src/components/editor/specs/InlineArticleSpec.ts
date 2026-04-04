import { Action, BlotSpec } from "@enzedonline/quill-blot-formatter2";
import {
  DeleteInlineArticleAction,
  EditInlineArticleAction,
} from "../actions";

export class InlineArticleSpec extends BlotSpec {
  list: HTMLElement | null = null;

  init = () => {
    this.formatter.quill.root.addEventListener("click", this.onClick);
  };

  getTargetElement = () => this.list;

  onHide = () => {
    // 移除选中状态 class
    if (this.list) {
      this.list.classList.remove("ql-inline-article-selected");
    }
    this.list = null;
  };

  onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // 检查是否点击了内联文章卡片，找到父级 list
    const list = target.closest(".ql-inline-article-list") as HTMLElement | null;

    if (this.formatter.enabled && list) {
      e.stopImmediatePropagation();
      e.preventDefault();
      this.list = list;
      // 添加选中状态 class 到 list
      list.classList.add("ql-inline-article-selected");

      // 设置 Quill 选区到该 blot 位置，使键盘删除可以正常工作
      const blot = this.formatter.quill.scroll.find(list);
      if (blot) {
        const index = this.formatter.quill.getIndex(blot);
        this.formatter.quill.setSelection(index, 1, "silent");
        this.formatter.quill.focus();
      }

      this.formatter.show(this);
    }
  };

  getActions = (): Array<Action> => {
    const actions: Action[] = [];

    // 编辑
    actions.push(new EditInlineArticleAction(this.formatter));
    // 删除
    actions.push(new DeleteInlineArticleAction(this.formatter));

    return actions;
  };
}
