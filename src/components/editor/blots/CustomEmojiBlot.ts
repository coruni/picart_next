import Quill from "quill";

export interface EmojiValue {
  src: string;
  alt?: string;
  name?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Embed = Quill.import("blots/embed") as any;

export class CustomEmojiBlot extends Embed {
  static blotName = "emoji";
  static tagName = "span";
  static className = "ql-emoji-embed";

  static create(value: string | EmojiValue) {
    const node = super.create() as HTMLElement;
    const img = document.createElement("img");

    const src = typeof value === "string" ? value : value.src;
    const alt = typeof value === "string" ? "" : value.alt || value.name || "";
    const name = typeof value === "string" ? "" : value.name || "";

    node.classList.add("ql-emoji-embed");
    node.setAttribute("contenteditable", "false");
    node.dataset.src = src;
    if (name) {
      node.dataset.name = name;
    }

    img.setAttribute("src", src);
    img.setAttribute("draggable", "false");
    img.classList.add("ql-emoji-embed__img");

    if (alt) {
      img.setAttribute("alt", alt);
      node.setAttribute("aria-label", alt);
      node.setAttribute("title", alt);
    }

    node.appendChild(img);
    return node;
  }

  static value(domNode: HTMLElement): EmojiValue {
    const img = domNode.querySelector("img");
    return {
      src: domNode.dataset.src || img?.getAttribute("src") || "",
      alt: img?.getAttribute("alt") || domNode.getAttribute("aria-label") || "",
      name: domNode.dataset.name || "",
    };
  }
}
