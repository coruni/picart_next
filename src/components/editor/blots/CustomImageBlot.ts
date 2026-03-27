import Quill from "quill";

// 图片值类型
export interface ImageValue {
  src: string;
  alt?: string;
}

// 自定义 Image Blot - 用 div 包裹 img，支持 alt 标题
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlockEmbed = Quill.import("blots/block/embed") as any;

export class CustomImageBlot extends BlockEmbed {
  static blotName = "image";
  static tagName = "DIV";
  static className = "ql-image-wrapper";

  static create(value: string | ImageValue) {
    const node = document.createElement("div") as HTMLElement;
    node.classList.add("ql-image-wrapper");

    const img = document.createElement("img");
    const src = typeof value === "string" ? value : value.src;
    const alt = typeof value === "string" ? "" : value.alt || "";

    img.setAttribute("src", src);
    img.classList.add("ql-image");
    if (alt) {
      img.setAttribute("alt", alt);
    }
    node.appendChild(img);

    // 创建可编辑 caption (p 标签)
    const caption = document.createElement("p");
    caption.classList.add("ql-image-caption");
    caption.setAttribute("contenteditable", "true");
    caption.setAttribute("data-placeholder", "添加图片说明...");
    caption.textContent = alt;
    node.appendChild(caption);

    return node;
  }

  static value(domNode: HTMLElement): ImageValue {
    const img = domNode.querySelector("img");
    const caption = domNode.querySelector(".ql-image-caption");

    return {
      src: img?.getAttribute("src") || "",
      alt:
        img?.getAttribute("alt") ||
        caption?.textContent?.trim() ||
        undefined,
    };
  }

  static formats(domNode: HTMLElement): Record<string, unknown> {
    const img = domNode.querySelector("img");
    if (!img) return {};
    const formats: Record<string, unknown> = {};
    const width = img.getAttribute("width");
    const height = img.getAttribute("height");
    const style = img.getAttribute("style");
    const alt = img.getAttribute("alt");
    if (width) formats.width = width;
    if (height) formats.height = height;
    if (style) formats.style = style;
    if (alt) formats.alt = alt;
    return formats;
  }

  format(name: string, value: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img = (this as any).domNode.querySelector("img");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caption = (this as any).domNode.querySelector(".ql-image-caption");

    if (img) {
      if (name === "width" || name === "height") {
        if (value) {
          img.setAttribute(name, String(value));
        } else {
          img.removeAttribute(name);
        }
      } else if (name === "style" && value) {
        img.setAttribute("style", String(value));
      } else if (name === "alt") {
        if (value) {
          img.setAttribute("alt", String(value));
          if (caption) caption.textContent = String(value);
        } else {
          img.removeAttribute("alt");
          if (caption) caption.textContent = "";
        }
      }
    }
    super.format(name, value);
  }
}
