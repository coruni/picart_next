import {
  Action,
  AlignAction,
} from "@enzedonline/quill-blot-formatter2";
import { BlotSpec } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";
import { DeleteVideoAction } from "../actions/DeleteVideoAction";

export class VideoSpec extends BlotSpec {
  wrapper: HTMLElement | null = null;
  iframe: HTMLIFrameElement | null = null;

  constructor(formatter: BlotFormatter) {
    super(formatter);
    this.init();
  }

  init = () => {
    this.formatter.quill.root.addEventListener("click", this.onClick);
  };

  getTargetElement = () => this.wrapper;

  onHide = () => {
    // 移除选中状态 class
    if (this.wrapper) {
      this.wrapper.classList.remove("ql-video-selected");
      // 恢复遮罩层的点击事件
      const overlay = this.wrapper.querySelector(".ql-video-overlay") as HTMLElement;
      if (overlay) {
        overlay.style.pointerEvents = "auto";
      }
    }
    this.wrapper = null;
    this.iframe = null;
  };

  onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // 检查是否点击了视频遮罩层或视频容器
    let wrapper: HTMLElement | null = null;

    if (target.classList.contains("ql-video-wrapper")) {
      wrapper = target;
    } else if (target.classList.contains("ql-video-overlay") ||
               target.classList.contains("ql-video-container")) {
      wrapper = target.closest(".ql-video-wrapper") as HTMLElement;
    } else if (target instanceof HTMLIFrameElement && target.classList.contains("ql-video-iframe")) {
      // 直接点击 iframe 的情况（理论上被遮罩层覆盖，但以防万一）
      wrapper = target.closest(".ql-video-wrapper") as HTMLElement;
    }

    if (this.formatter.enabled && wrapper) {
      e.stopImmediatePropagation();
      e.preventDefault();
      this.wrapper = wrapper;
      this.iframe = wrapper.querySelector(".ql-video-iframe") as HTMLIFrameElement;
      // 添加选中状态
      wrapper.classList.add("ql-video-selected");
      // 隐藏遮罩层以便用户可以交互
      const overlay = wrapper.querySelector(".ql-video-overlay") as HTMLElement;
      if (overlay) {
        overlay.style.pointerEvents = "none";
      }
      this.formatter.show(this);
    }
  };

  getActions = (): Array<Action> => {
    const actions: Action[] = [];

    // 居左居中居右 (AlignAction)
    if (this.formatter.options.align?.allowAligning !== false) {
      actions.push(new AlignAction(this.formatter));
    }

    // 删除
    actions.push(new DeleteVideoAction(this.formatter));

    return actions;
  };
}
