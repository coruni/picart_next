import Quill from "quill";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlockEmbed = Quill.import("blots/block/embed") as any;

export interface DividerValue {
  style?: "pulse" | "triple" | "hex" | "travel" | "dashed";
}

export class DividerBlot extends BlockEmbed {
  static blotName = "divider";
  static tagName = "DIV";
  static className = "ql-divider";

  static create(value?: DividerValue | boolean) {
    const node = document.createElement("div") as HTMLElement;
    node.classList.add("ql-divider");
    node.setAttribute("contenteditable", "false");

    const style = (value && typeof value === "object" && value.style) ? value.style : "pulse";
    node.dataset.style = style;

    const innerHtml = this.getDividerHtml(style);
    node.innerHTML = innerHtml;

    return node;
  }

  static getDividerHtml(style: string): string {
    const primaryColor = "var(--color-primary, #6680ff)";
    const styles: Record<string, string> = {
      pulse: `<div class="flex items-center w-full"><div class="h-[1.5px] flex-1 bg-primary origin-right div-line-left"></div><div class="relative mx-2 size-3.5 shrink-0"><span class="absolute inset-0 rounded-full bg-primary/30 animate-ping"></span><span class="relative block size-full rounded-full bg-primary"></span></div><div class="h-[1.5px] flex-1 bg-primary origin-left div-line-right"></div></div>`,
      triple: `<div class="flex flex-col gap-0.75 w-full "><div class="h-1  rounded-sm bg-primary div-triple-1"></div><div class="h-0.5 rounded-sm bg-primary/60 div-triple-2"></div><div class="h-px bg-primary/20 div-triple-3"></div></div>`,
      hex: `<div class="flex items-center w-full"><div class="flex-1 h-0.5 bg-primary/30 div-hex-left"></div><div class="flex gap-1.25 px-2.5 shrink-0"><svg class="div-hex-icon" width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M5 0.5L9.33 3v5L5 10.5L.67 8V3L5 .5z" fill="${primaryColor}"/></svg><svg class="div-hex-icon" width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M5 .5L9.33 3v5L5 10.5L.67 8V3L5 .5z" fill="${primaryColor}"/></svg><svg class="div-hex-icon" width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M5 .5L9.33 3v5L5 10.5L.67 8V3L5 .5z" fill="${primaryColor}"/></svg></div><div class="flex-1 h-0.5 bg-primary/30 div-hex-right"></div></div>`,
      travel: `<div class="relative w-full h-0.5 overflow-hidden"><div class="absolute inset-0 border-t-2 border-dashed border-primary/40"></div><div class="absolute top-1/2 -translate-y-1/2 w-1/5 h-1.5 rounded-full bg-primary div-travel-dot"></div></div>`,
      dashed: `<svg class="w-full h-4.5 div-dashed" viewBox="0 0 560 18"><line x1="0" y1="14" x2="560" y2="14" stroke="#a0b0ff" stroke-width="1" stroke-dasharray="8 6" opacity="0.4"/><line class="div-dashed-slash div-dashed-1" x1="40" y1="14" x2="35" y2="4" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/><line class="div-dashed-slash div-dashed-2" x1="120" y1="14" x2="115" y2="4" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/><line class="div-dashed-slash div-dashed-3" x1="200" y1="14" x2="195" y2="4" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/><line class="div-dashed-slash div-dashed-4" x1="280" y1="14" x2="275" y2="4" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/><line class="div-dashed-slash div-dashed-5" x1="360" y1="14" x2="355" y2="4" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/><line class="div-dashed-slash div-dashed-6" x1="440" y1="14" x2="435" y2="4" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/><line class="div-dashed-slash div-dashed-7" x1="520" y1="14" x2="515" y2="4" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    };
    return styles[style] || styles.pulse;
  }

  static value(domNode: HTMLElement): DividerValue {
    return {
      style: (domNode.dataset.style as DividerValue["style"]) || "pulse",
    };
  }

  static formats(domNode: HTMLElement): Record<string, unknown> {
    const formats: Record<string, unknown> = {};
    if (domNode.dataset.style) {
      formats.style = domNode.dataset.style;
    }
    return formats;
  }
}
