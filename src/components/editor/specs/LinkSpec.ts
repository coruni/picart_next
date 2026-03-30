import { Action, BlotSpec } from "@enzedonline/quill-blot-formatter2";
import { EditLinkAction, RemoveLinkAction } from "../actions";

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
      const isSameActiveLink =
        this.formatter.currentSpec === this && this.link === link;
      if (isSameActiveLink) {
        this.applyOverlayStyles();
        return;
      }

      e.stopImmediatePropagation();
      e.preventDefault();
      this.link = link;
      this.formatter.show(this);
      requestAnimationFrame(() => {
        this.applyOverlayStyles();
      });
    }
  };

  applyOverlayStyles = () => {
    const toolbar = this.formatter.overlay?.querySelector(
      ".blot-formatter__toolbar",
    ) as HTMLElement | null;
    if (toolbar) {
      Object.assign(toolbar.style, {
        display: "inline-flex",
        width: "max-content",
        minWidth: "max-content",
        maxWidth: "max-content",
      });
    }
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