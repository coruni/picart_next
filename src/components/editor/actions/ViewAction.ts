import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";

export class ViewAction extends Action {
  constructor(formatter: BlotFormatter) {
    super(formatter);
    this.toolbarButtons = [
      new ToolbarButton(
        "view",
        this.onClickHandler,
        this.formatter.options.toolbar,
      ),
    ];
  }

  onClickHandler: EventListener = () => {
    const img =
      this.formatter.currentSpec?.getTargetElement() as HTMLImageElement;
    if (!img) return;

    const viewer = document.createElement("div");
    viewer.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;";
    const fullImg = document.createElement("img");
    fullImg.src = img.src;
    fullImg.style.cssText = "max-width:90%;max-height:90%;object-fit:contain;";
    viewer.appendChild(fullImg);
    viewer.onclick = () => viewer.remove();
    document.body.appendChild(viewer);
  };
}