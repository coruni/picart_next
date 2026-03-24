import { BlotSpec, Action } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";
import { EditLinkAction, RemoveLinkAction } from "./actions";

export class CustomLinkSpec extends BlotSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  link: any = null;

  init = () => {
    this.formatter.quill.root.addEventListener("click", this.onClick);
  };

  getTargetElement = () => this.link;

  onHide = () => {
    this.link = null;
  };

  onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (this.formatter.enabled && link && this.formatter.quill.root.contains(link)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      this.link = link;
      this.formatter.show(this);
    }
  };

  getOverlayElement = (): HTMLElement | null => {
    const overlay = super.getOverlayElement();
    if (overlay) {
      // 强制 overlay 不跟随链接宽度
      Object.assign(overlay.style, {
        width: "auto",
        minWidth: "0",
        maxWidth: "none",
      });
      // 强制 toolbar 固定宽度
      requestAnimationFrame(() => {
        const toolbar = overlay.querySelector(".blot-formatter__toolbar") as HTMLElement;
        if (toolbar) {
          Object.assign(toolbar.style, {
            width: "auto",
            minWidth: "auto",
          });
        }
      });
    }
    return overlay;
  };

  getActions = (): Array<Action> => {
    const actions: Action[] = [];
    // 编辑链接
    actions.push(new EditLinkAction(this.formatter));
    // 移除链接
    actions.push(new RemoveLinkAction(this.formatter));
    return actions;
  };
}