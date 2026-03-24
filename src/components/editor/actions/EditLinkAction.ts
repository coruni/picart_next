import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";

export class EditLinkAction extends Action {
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
    const link = this.formatter.currentSpec?.getTargetElement() as HTMLAnchorElement;
    if (!link) return;

    // 获取链接信息并触发编辑
    const href = link.getAttribute("href") || "";
    const text = link.textContent || "";

    // 发送自定义事件让 Editor 处理
    const event = new CustomEvent("link-edit", {
      detail: { href, text },
    });
    document.dispatchEvent(event);

    this.formatter.hide();
  };
}