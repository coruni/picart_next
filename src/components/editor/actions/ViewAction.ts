import type BlotFormatter from "@enzedonline/quill-blot-formatter2";
import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";

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

    // 收集编辑器中所有图片
    const editorRoot = img.closest(".ql-editor");
    if (!editorRoot) return;

    const allImages = Array.from(
      editorRoot.querySelectorAll("img.ql-image"),
    ) as HTMLImageElement[];
    const imageUrls = allImages.map((image) => image.src);
    const currentIndex = allImages.indexOf(img);

    // 创建简单的查看器容器
    const viewer = document.createElement("div");
    viewer.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;";
    const fullImg = document.createElement("img");
    fullImg.src = imageUrls[currentIndex >= 0 ? currentIndex : 0];
    fullImg.style.cssText = "max-width:90%;max-height:90%;object-fit:contain;";
    viewer.appendChild(fullImg);
    viewer.onclick = () => viewer.remove();
    document.body.appendChild(viewer);
  };
}
