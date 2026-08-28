import {
  Action,
  AlignAction,
  ImageSpec,
} from "@enzedonline/quill-blot-formatter2";
import {
  CopyAction,
  DeleteAction,
  ReplaceAction,
  ViewAction,
} from "../actions";

export class CustomImageSpec extends ImageSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  img: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wrapper: any = null;
  // 记录由 caption 点击触发的选中，show 时保持 caption 焦点不重置选区
  captionToKeep: HTMLElement | null = null;

  init = () => {
    this.formatter.quill.root.addEventListener("click", this.onClick);
  };

  getTargetElement = () => this.wrapper;

  getOverlayElement = () => {
    // 让 overlay 只覆盖 img，露出的 caption 区域可被点击编辑
    return this.img;
  };

  setSelection = () => {
    // 由 caption 点击触发的选中：保持 caption 焦点，不重置 selection
    const caption = this.captionToKeep;
    this.captionToKeep = null;
    if (caption) {
      return;
    }
    this.formatter.quill.setSelection(null);
  };

  onHide = () => {
    // 移除选中状态 class
    if (this.wrapper) {
      this.wrapper.classList.remove("ql-image-selected");
    }
    this.img = null;
    this.wrapper = null;
  };

  onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // caption 是 image blot 的子节点：点击它应选中整个 image blot
    if (target.classList.contains("ql-image-caption")) {
      // 若当前 image 已激活，则允许光标进入 caption 编辑，不隐藏 formatter
      if (
        this.formatter.currentSpec === this &&
        this.wrapper?.contains(target)
      ) {
        e.stopImmediatePropagation();
        return;
      }
      // 未激活：点击 caption 视为点击 image blot，并保持 caption 焦点
      const wrapper = target.closest(
        ".ql-image-wrapper",
      ) as HTMLElement | null;
      const img = wrapper?.querySelector<HTMLImageElement>("img.ql-image");
      if (this.formatter.enabled && img && wrapper) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.img = img;
        this.wrapper = wrapper;
        wrapper.classList.add("ql-image-selected");
        // 标记由 caption 触发，setSelection 不会清空选区导致失焦
        this.captionToKeep = target;
        this.formatter.show(this);
        this.captionToKeep = null;
      }
      return;
    }

    // 检查是否点击了图片或包含图片的 wrapper
    let img: HTMLImageElement | null = null;
    let wrapper: HTMLElement | null = null;

    if (target instanceof HTMLImageElement) {
      img = target;
      wrapper = target.closest(".ql-image-wrapper") as HTMLElement;
    } else if (target.classList.contains("ql-image-wrapper")) {
      wrapper = target as HTMLElement;
      img = wrapper.querySelector("img.ql-image");
    } else {
      wrapper = target.closest(".ql-image-wrapper") as HTMLElement;
      if (wrapper) {
        img = wrapper.querySelector("img.ql-image");
      }
    }

    if (this.formatter.enabled && img && wrapper) {
      // 已激活同一张图片时避免重复 show/hide
      if (this.formatter.currentSpec === this && this.wrapper === wrapper) {
        e.stopImmediatePropagation();
        return;
      }
      e.stopImmediatePropagation();
      e.preventDefault();
      this.img = img;
      this.wrapper = wrapper;
      // 添加选中状态 class
      wrapper.classList.add("ql-image-selected");
      this.formatter.show(this);
    }
  };

  getActions = (): Array<Action> => {
    // 自定义排序：替换图片、查看大图、居左居中居右、复制、删除
    const actions: Action[] = [];

    // 替换图片
    actions.push(new ReplaceAction(this.formatter));
    // 查看大图
    actions.push(new ViewAction(this.formatter));
    // 居左居中居右 (AlignAction)
    if (this.formatter.options.align.allowAligning) {
      actions.push(new AlignAction(this.formatter));
    }
    // 复制
    actions.push(new CopyAction(this.formatter));
    // 删除
    actions.push(new DeleteAction(this.formatter));

    return actions;
  };
}
