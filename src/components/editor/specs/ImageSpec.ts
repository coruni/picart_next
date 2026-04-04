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

  init = () => {
    this.formatter.quill.root.addEventListener("click", this.onClick);
  };

  getTargetElement = () => this.wrapper;

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

    // 如果点击的是 caption，不处理，允许编辑
    if (target.classList.contains("ql-image-caption")) {
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
