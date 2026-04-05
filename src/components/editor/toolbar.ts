import {
  emojiControllerFindAll,
  emojiControllerIncrementUseCount,
} from "@/api/sdk.gen";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Quill from "quill";
import { colorPalette, fontSizes, icons, renderIcon } from "./constants";

const {
  Undo2,
  Redo2,
  Smile,
  Image,
  Video,
  Type,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Palette,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  List,
  Plus,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Link,
  RemoveFormatting,
  Minus,
  FileText,
} = icons;

interface RenderToolbarOptions {
  quill: Quill;
  container: HTMLElement;
  t: (key: string) => string;
  onVideoClick: () => void;
  onLinkClick: () => void;
  onImageUpload: () => void;
  onArticleClick: () => void;
  onSaveSelection?: () => void; // 保存选区的回调
}

type EmojiRecord = {
  id: string;
  name: string;
  url: string;
  code?: string;
  category?: string;
};

type EmojiTab = {
  key: string;
  label: string;
  icon?: string;
};

type EmojiGroup = {
  name: string;
  items: EmojiRecord[];
  count?: number;
};

export const renderToolbar = ({
  quill,
  container,
  t,
  onVideoClick,
  onLinkClick,
  onImageUpload,
  onArticleClick,
  onSaveSelection,
}: RenderToolbarOptions) => {
  const toolbar = document.createElement("div");
  toolbar.className =
    "ql-toolbar ql-snow top-header sticky z-20 flex items-center bg-border! shadow-sm";

  let emojiPanelInitialized = false;
  let activeEmojiTabKey = "all";
  let groupedEmojiList: EmojiGroup[] = [];
  let emojiTabs: EmojiTab[] = [{ key: "all", label: "All" }];

  // 关闭所有下拉菜单
  const closeAllDropdowns = () => {
    container.querySelectorAll('[id^="dropdown-"]').forEach((el) => {
      el.classList.add("hidden");
    });
  };

  // 切换指定下拉菜单（先关闭其他下拉菜单，再切换目标）
  const toggleDropdown = (dropdownId: string, e: Event) => {
    e.stopPropagation();
    const dropdown = document.getElementById(dropdownId);
    const isCurrentlyHidden = dropdown?.classList.contains("hidden");
    closeAllDropdowns();
    // 如果之前是隐藏的，现在显示它；如果之前是显示的，关闭后保持隐藏
    if (isCurrentlyHidden) {
      dropdown?.classList.remove("hidden");
    }
  };

  const normalizeEmojiRecord = (item: unknown): EmojiRecord | null => {
    const raw = item as {
      id?: string | number;
      _id?: string | number;
      name?: string;
      url?: string;
      imageUrl?: string;
      code?: string;
      category?: string;
    };
    const url = raw.url || raw.imageUrl;
    if (!url) return null;
    const id = String(raw.id ?? raw._id ?? url);

    return {
      id,
      name: raw.name || raw.code || "emoji",
      url,
      code: raw.code,
      category: raw.category,
    };
  };

  const normalizeEmojiGroups = (response: unknown): EmojiGroup[] => {
    const payload = (response as { data?: { data?: unknown } })?.data?.data as
      | { groups?: unknown[] }
      | undefined;
    const groups = Array.isArray(payload?.groups) ? payload.groups : [];
    const normalizedGroups: EmojiGroup[] = [];

    groups.forEach((group) => {
      const raw = group as {
        name?: string;
        count?: number;
        items?: unknown[];
      };
      if (!raw.name || !Array.isArray(raw.items)) return;

      const items = raw.items.reduce<EmojiRecord[]>((acc, item) => {
        const normalized = normalizeEmojiRecord(item);
        if (normalized) {
          acc.push(normalized);
        }
        return acc;
      }, []);

      normalizedGroups.push({
        name: raw.name,
        count: raw.count,
        items,
      });
    });

    return normalizedGroups;
  };

  const fetchEmojiListByTab = async (tabKey: string) => {
    if (tabKey === "all") {
      return groupedEmojiList.flatMap((group) => group.items);
    }

    const localGroup = groupedEmojiList.find((group) => group.name === tabKey);
    if (localGroup) {
      return localGroup.items;
    }
    return [];
  };

  const fetchEmojiTabs = async () => {
    try {
      const response = await emojiControllerFindAll({
        query: {
          page: 1,
          limit: 100,
          grouped: true,
        },
      });
      groupedEmojiList = normalizeEmojiGroups(response);

      emojiTabs = [
        { key: "all", label: "All" },
        ...groupedEmojiList.map((group) => ({
          key: group.name,
          label: group.name,
          icon: group.items[0]?.url,
        })),
      ];
    } catch (error) {
      console.error("Failed to load emoji tabs:", error);
    }
  };

  const insertEmoji = async (emoji: EmojiRecord) => {
    const selection = quill.getSelection(true);
    const index = selection?.index ?? quill.getLength();
    if (!emoji.url) return;

    quill.insertEmbed(
      index,
      "emoji",
      { src: emoji.url, alt: emoji.name, name: emoji.name },
      "user",
    );
    quill.insertText(index + 1, " ", "user");
    quill.setSelection(index + 2, 0, "silent");

    try {
      await emojiControllerIncrementUseCount({ path: { id: emoji.id } });
    } catch (error) {
      console.error("Failed to update emoji usage:", error);
    }
  };

  // 创建带tooltip的按钮
  const createTooltipButton = (
    button: HTMLButtonElement,
    tooltipText: string,
  ) => {
    const wrapper = document.createElement("span");
    wrapper.className = "tooltip-wrapper";
    button.style.position = "relative";
    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.textContent = tooltipText;
    wrapper.appendChild(button);
    wrapper.appendChild(tooltip);
    return wrapper;
  };

  // 创建颜色下拉菜单
  const createColorDropdown = (
    triggerBtn: HTMLButtonElement,
    title: string,
    dropdownKey: string,
    onSelect: (color: string | false) => void,
  ) => {
    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "relative inline-flex tooltip-wrapper";

    const dropdown = document.createElement("div");
    dropdown.className =
      "absolute top-full left-0 z-50 mt-2 bg-card border border-border rounded-xl shadow-lg p-3 hidden w-48";
    dropdown.id = `dropdown-${dropdownKey}`;

    // 标题
    const titleEl = document.createElement("div");
    titleEl.className = "text-sm font-medium mb-2";
    titleEl.textContent = title;
    dropdown.appendChild(titleEl);

    // 颜色网格
    const colorGrid = document.createElement("div");
    colorGrid.className = "grid grid-cols-8 gap-1.5";

    // 第一个是取消/移除颜色
    const removeBtn = document.createElement("button");
    removeBtn.className =
      "w-5! h-5! flex-none rounded flex items-center justify-center bg-muted hover:bg-accent border! border-border!";
    removeBtn.innerHTML = renderIcon(X);
    removeBtn.onclick = () => {
      onSelect(false);
      dropdown.classList.add("hidden");
    };
    colorGrid.appendChild(removeBtn);

    // 添加颜色
    colorPalette.forEach((color) => {
      const colorBtn = document.createElement("button");
      colorBtn.className =
        "w-5! h-5! flex-none rounded hover:ring-2 hover:ring-primary/50";
      colorBtn.style.backgroundColor = color;
      colorBtn.onclick = () => {
        onSelect(color);
        dropdown.classList.add("hidden");
      };
      colorGrid.appendChild(colorBtn);
    });

    dropdown.appendChild(colorGrid);

    // 分割线
    const divider = document.createElement("div");
    divider.className = "border-t border-border my-2";
    dropdown.appendChild(divider);

    // 十六进制输入
    const hexInputContainer = document.createElement("div");
    hexInputContainer.className = "flex items-center gap-1 w-full";
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.placeholder = "#000000";
    hexInput.className =
      "flex h-6 w-16 rounded-md border border-primary! bg-card px-2 py-1 text-sm placeholder:text-gray-400 focus:outline-none transition-colors duration-200 border-gray-300 hover:border-primary focus:border-primary flex-shrink-0 flex-1";
    hexInput.maxLength = 7;
    const hexBtn = document.createElement("button");
    hexBtn.className =
      "inline-flex items-center justify-center rounded-md border! border-primary! font-medium transition-all duration-200 focus:outline-none bg-primary text-primary! hover:bg-primary/20! px-2 h-6! text-xs whitespace-nowrap flex-shrink-0";
    hexBtn.textContent = t("confirm");
    hexBtn.onclick = () => {
      const hex = hexInput.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        onSelect(hex);
        dropdown.classList.add("hidden");
      }
    };
    hexInputContainer.appendChild(hexInput);
    hexInputContainer.appendChild(hexBtn);
    dropdown.appendChild(hexInputContainer);

    dropdownContainer.appendChild(triggerBtn);
    dropdownContainer.appendChild(dropdown);

    // 添加tooltip
    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.textContent = title;
    dropdownContainer.appendChild(tooltip);

    triggerBtn.onclick = (e) => {
      toggleDropdown(`dropdown-${dropdownKey}`, e);
    };

    return dropdownContainer;
  };

  const createEmojiPanelDropdown = (triggerBtn: HTMLButtonElement) => {
    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "relative inline-flex tooltip-wrapper";

    const dropdown = document.createElement("div");
    dropdown.className =
      "emoji-panel-dropdown absolute top-full left-0 z-50 mt-3 hidden w-full max-w-[600px] min-w-[360px] rounded-2xl border border-border bg-card shadow-xl";
    dropdown.id = "dropdown-emoji-panel";

    const tabs = document.createElement("div");
    tabs.className =
      "emoji-panel-tabs flex h-[46px] items-center gap-2 overflow-x-auto border-b border-border px-3 bg-border rounded-t-xl";

    const tabsViewport = document.createElement("div");
    tabsViewport.className =
      "emoji-panel-tabs-viewport flex h-[46px] items-center gap-2 overflow-x-auto px-1";

    const list = document.createElement("div");
    list.className =
      "emoji-panel-list grid h-[256px] grid-cols-8 content-start gap-2 overflow-y-auto px-3 py-3";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className =
      "emoji-panel-nav flex h-7! w-7! items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-card!";
    prevBtn.innerHTML = renderIcon(ChevronLeft, "w-4 h-4", 16);

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className =
      "emoji-panel-nav flex h-7! w-7! items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-card!";
    nextBtn.innerHTML = renderIcon(ChevronRight, "w-4 h-4", 16);

    const renderTabIcon = (tab: EmojiTab) => {
      if (!tab.icon) {
        return `<span class="emoji-panel-tab-fallback">${tab.label.slice(0, 1)}</span>`;
      }
      if (tab.icon.startsWith("/") || tab.icon.startsWith("http")) {
        return `<img src="${tab.icon}" alt="${tab.label}" class="emoji-panel-tab-image" />`;
      }
      return `<span class="emoji-panel-tab-emoji">${tab.icon}</span>`;
    };

    const renderEmojiState = (text: string) => {
      list.innerHTML = `<div class="emoji-panel-state">${text}</div>`;
    };

    const renderEmojiList = (items: EmojiRecord[]) => {
      if (!items.length) {
        renderEmojiState("No emoji");
        return;
      }

      list.innerHTML = "";
      items.forEach((emoji) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className =
          "emoji-panel-item flex h-12! w-12! items-center justify-center rounded-xl border border-transparent bg-transparent p-1 transition-all hover:border-border hover:bg-accent";
        item.title = emoji.name;
        item.innerHTML = `<img src="${emoji.url}" alt="${emoji.name}" class="max-h-full max-w-full object-contain" loading="lazy" />`;
        item.onclick = async () => {
          await insertEmoji(emoji);
          dropdown.classList.add("hidden");
        };
        list.appendChild(item);
      });
    };

    const setActiveTab = async (tabKey: string) => {
      activeEmojiTabKey = tabKey;
      tabsViewport
        .querySelectorAll<HTMLButtonElement>("[data-emoji-tab]")
        .forEach((button) => {
          const isActive = button.dataset.emojiTab === tabKey;
          button.dataset.active = isActive ? "true" : "false";
        });

      renderEmojiState("Loading...");
      try {
        const items = await fetchEmojiListByTab(tabKey);
        renderEmojiList(items);
      } catch (error) {
        console.error("Failed to load emoji list:", error);
        renderEmojiState("Load failed");
      }
    };

    const renderTabs = () => {
      tabsViewport.innerHTML = "";
      emojiTabs.forEach((tab) => {
        const tabBtn = document.createElement("button");
        tabBtn.type = "button";
        tabBtn.className =
          "emoji-panel-tab flex h-8 items-center justify-center rounded-xl px-2 transition-colors hover:bg-card!";
        tabBtn.dataset.emojiTab = tab.key;
        tabBtn.dataset.active =
          tab.key === activeEmojiTabKey ? "true" : "false";
        tabBtn.title = tab.label;
        tabBtn.innerHTML = renderTabIcon(tab);
        tabBtn.onclick = () => {
          void setActiveTab(tab.key);
        };
        tabsViewport.appendChild(tabBtn);
      });
    };

    const scrollTabs = (direction: "prev" | "next") => {
      const amount = 180;
      tabsViewport.scrollBy({
        left: direction === "next" ? amount : -amount,
        behavior: "smooth",
      });
    };

    prevBtn.onclick = () => scrollTabs("prev");
    nextBtn.onclick = () => scrollTabs("next");

    triggerBtn.onclick = async (e) => {
      e.stopPropagation();
      const isHidden = dropdown.classList.contains("hidden");
      closeAllDropdowns();

      if (!isHidden) {
        dropdown.classList.add("hidden");
        return;
      }

      dropdown.classList.remove("hidden");

      if (!emojiPanelInitialized) {
        emojiPanelInitialized = true;
        renderEmojiState("Loading...");
        await fetchEmojiTabs();
        renderTabs();
        await setActiveTab(activeEmojiTabKey);
        return;
      }

      await setActiveTab(activeEmojiTabKey);
    };

    tabs.appendChild(prevBtn);
    tabs.appendChild(tabsViewport);
    tabs.appendChild(nextBtn);
    dropdown.appendChild(tabs);
    dropdown.appendChild(list);
    dropdownContainer.appendChild(triggerBtn);
    dropdownContainer.appendChild(dropdown);

    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.textContent = t("emoji");
    dropdownContainer.appendChild(tooltip);

    return dropdownContainer;
  };

  // 第一行：undo redo | emoji image video more
  const row1 = document.createElement("div");
  row1.className = "ql-formats flex! items-center gap-3";

  // Undo, Redo
  const undoBtn = document.createElement("button");
  undoBtn.className = "ql-undo";
  undoBtn.type = "button";
  undoBtn.innerHTML = renderIcon(Undo2);
  undoBtn.onclick = () => quill.history.undo();
  row1.appendChild(createTooltipButton(undoBtn, t("undo")));

  const redoBtn = document.createElement("button");
  redoBtn.className = "ql-redo";
  redoBtn.type = "button";
  redoBtn.innerHTML = renderIcon(Redo2);
  redoBtn.onclick = () => quill.history.redo();
  row1.appendChild(createTooltipButton(redoBtn, t("redo")));

  // 分隔符
  const divider1 = document.createElement("span");
  divider1.className = "w-px h-4 bg-[#eceff4] mx-1";
  row1.appendChild(divider1);

  // Emoji, Image
  const emojiBtn = document.createElement("button");
  emojiBtn.className = "ql-emoji";
  emojiBtn.type = "button";
  emojiBtn.innerHTML = renderIcon(Smile);
  row1.appendChild(createEmojiPanelDropdown(emojiBtn));

  const imageBtn = document.createElement("button");
  imageBtn.className = "ql-image";
  imageBtn.type = "button";
  imageBtn.innerHTML = renderIcon(Image);
  imageBtn.onclick = onImageUpload;
  row1.appendChild(createTooltipButton(imageBtn, t("image")));

  // Video 按钮
  const videoBtn = document.createElement("button");
  videoBtn.className = "ql-video";
  videoBtn.type = "button";
  videoBtn.innerHTML = renderIcon(Video);
  videoBtn.onmousedown = (e) => {
    // 防止按钮导致失焦
    e.preventDefault();
  };
  videoBtn.onclick = () => {
    // 保存选区并打开对话框
    onSaveSelection?.();
    onVideoClick();
  };
  row1.appendChild(createTooltipButton(videoBtn, t("video")));

  // 更多下拉菜单 - 点击显示
  const moreDiv = document.createElement("div");
  moreDiv.className = "relative inline-flex tooltip-wrapper";
  const moreBtn = document.createElement("button");
  moreBtn.className =
    "flex w-full! items-center justify-center rounded-full bg-primary text-primary";
  moreBtn.type = "button";
  moreBtn.innerHTML = renderIcon(Plus, "w-3 h-3", 22);
  moreDiv.appendChild(moreBtn);
  const moreTooltip = document.createElement("span");
  moreTooltip.className = "tooltip";
  moreTooltip.textContent = t("more");
  moreDiv.appendChild(moreTooltip);

  const moreDropdown = document.createElement("div");
  moreDropdown.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2 px-1 min-w-32 flex flex-col hidden";
  moreDropdown.id = "dropdown-more";

  // Link 项
  const linkItem = document.createElement("button");
  linkItem.className =
    "w-full! hover:bg-primary/15! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors text-nowrap";
  linkItem.type = "button";
  linkItem.innerHTML = `${renderIcon(Link, "w-4 h-4!")}<span>${t("link")}</span>`;
  linkItem.onclick = () => {
    onLinkClick();
    moreDropdown.classList.add("hidden");
  };
  moreDropdown.appendChild(linkItem);

  // Video 项
  const videoItem = document.createElement("button");
  videoItem.className =
    "w-full! hover:bg-primary/15! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors text-nowrap";
  videoItem.type = "button";
  videoItem.innerHTML = `${renderIcon(Video, "w-4 h-4!")}<span>${t("video")}</span>`;
  videoItem.onmousedown = (e) => {
    // 防止按钮导致失焦
    e.preventDefault();
  };
  videoItem.onclick = () => {
    // 保存选区并打开对话框
    onSaveSelection?.();
    onVideoClick();
    moreDropdown.classList.add("hidden");
  };
  moreDropdown.appendChild(videoItem);

  // 内联文章项
  const articleItem = document.createElement("button");
  articleItem.className =
    "w-full! hover:bg-primary/15! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors text-nowrap";
  articleItem.type = "button";
  articleItem.innerHTML = `${renderIcon(FileText, "w-4 h-4!")}<span>${t("inlineArticle")}</span>`;
  articleItem.onclick = () => {
    onArticleClick();
    moreDropdown.classList.add("hidden");
  };
  moreDropdown.appendChild(articleItem);

  // 分割线
  const divider = document.createElement("div");
  divider.className = "border-t border-border my-1.5 mx-2";
  moreDropdown.appendChild(divider);

  // Clean 项
  const cleanItem = document.createElement("button");
  cleanItem.className =
    "w-full! hover:bg-primary/15! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors text-nowrap";
  cleanItem.type = "button";
  cleanItem.innerHTML = `${renderIcon(RemoveFormatting, "w-4 h-4!")}<span>${t("clean")}</span>`;
  cleanItem.onclick = () => {
    const format = quill.getFormat();
    Object.keys(format).forEach((key) => quill.format(key, false));
    moreDropdown.classList.add("hidden");
  };
  moreDropdown.appendChild(cleanItem);

  // 分割线二级面板 - hover 触发
  const createDividerPanel = () => {
    const dividerTrigger = document.createElement("div");
    dividerTrigger.className =
      "relative flex items-center px-3 py-2 rounded-md text-left gap-2 text-sm hover:text-primary hover:bg-primary/15 transition-colors text-nowrap cursor-pointer";
    dividerTrigger.innerHTML = `${renderIcon(Minus, "w-4 h-4!")}<span>${t("divider")}</span><span class="ml-auto text-muted-foreground">›</span>`;

    const dividerPanel = document.createElement("div");
    dividerPanel.className =
      "hidden absolute -top-2 left-full z-50 ml-1 w-32 rounded-xl border border-border bg-card px-3 py-3 shadow-lg";
    dividerPanel.id = "dropdown-divider-panel";

    // 网格容器
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 gap-2";

    // 分割线样式选项
    const dividerStyles = [
      {
        name: "pulse",
        preview: `<div class="flex items-center w-full"><div class="h-[1.5px] flex-1 bg-primary origin-right"></div><div class="relative mx-2 size-3.5 shrink-0"><span class="absolute inset-0 rounded-full bg-primary/30"></span><span class="relative block size-full rounded-full bg-primary"></span></div><div class="h-[1.5px] flex-1 bg-primary origin-left"></div></div>`,
      },
      {
        name: "triple",
        preview: `<div class="flex flex-col gap-0.75 w-full"><div class="h-1 rounded-sm bg-primary"></div><div class="h-0.5 rounded-sm bg-primary/60"></div><div class="h-px bg-primary/20"></div></div>`,
      },
      {
        name: "hex",
        preview: `<div class="flex items-center w-full"><div class="flex-1 h-0.5 bg-primary/30"></div><div class="flex gap-1.25 px-2.5 shrink-0 [&_svg]:size-2.5!"><svg width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M5 0.5L9.33 3v5L5 10.5.67 8V3L5 .5z" fill="#6680ff"/></svg><svg width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M5 .5L9.33 3v5L5 10.5.67 8V3L5 .5z" fill="#6680ff"/></svg><svg width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M5 .5L9.33 3v5L5 10.5.67 8V3L5 .5z" fill="#6680ff"/></svg></div><div class="flex-1 h-px bg-primary/30"></div></div>`,
      },
      {
        name: "travel",
        preview: `<div class="relative w-full h-0.5 overflow-hidden"><div class="absolute inset-0 border-t-2 border-dashed border-primary/40"></div><div class="absolute top-1/2 -translate-y-1/2 w-1/5 h-1.5 rounded-full bg-primary"></div></div>`,
      },
      {
        name: "dashed",
        preview: `<svg class="w-full h-5" viewBox="0 0 560 18" preserveAspectRatio="none"><line x1="0" y1="14" x2="560" y2="14" stroke="#a0b0ff" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6"/><line x1="40" y1="14" x2="35" y2="4" stroke="#6680ff" stroke-width="2" stroke-linecap="round"/><line x1="120" y1="14" x2="115" y2="4" stroke="#6680ff" stroke-width="2" stroke-linecap="round"/><line x1="200" y1="14" x2="195" y2="4" stroke="#6680ff" stroke-width="2" stroke-linecap="round"/><line x1="280" y1="14" x2="275" y2="4" stroke="#6680ff" stroke-width="2" stroke-linecap="round"/><line x1="360" y1="14" x2="355" y2="4" stroke="#6680ff" stroke-width="2" stroke-linecap="round"/><line x1="440" y1="14" x2="435" y2="4" stroke="#6680ff" stroke-width="2" stroke-linecap="round"/><line x1="520" y1="14" x2="515" y2="4" stroke="#6680ff" stroke-width="2" stroke-linecap="round"/></svg>`,
      },
    ];

    dividerStyles.forEach(({ name, preview }) => {
      const item = document.createElement("button");
      item.className =
        "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors border border-border bg-card";
      item.type = "button";

      // 预览区域
      const previewDiv = document.createElement("div");
      previewDiv.className = "w-full flex items-center justify-center";
      previewDiv.innerHTML = preview;

      item.appendChild(previewDiv);

      item.onclick = () => {
        const selection = quill.getSelection(true);
        const index = selection?.index ?? quill.getLength();
        quill.insertEmbed(index, "divider", { style: name }, "user");
        quill.setSelection(index + 1, 0, "silent");
        moreDropdown.classList.add("hidden");
      };

      grid.appendChild(item);
    });

    dividerPanel.appendChild(grid);

    // Hover 事件
    dividerTrigger.addEventListener("mouseenter", () => {
      dividerPanel.classList.remove("hidden");
    });

    dividerTrigger.addEventListener("mouseleave", () => {
      setTimeout(() => {
        if (!dividerPanel.matches(":hover")) {
          dividerPanel.classList.add("hidden");
        }
      }, 100);
    });

    dividerPanel.addEventListener("mouseenter", () => {
      dividerPanel.classList.remove("hidden");
    });

    dividerPanel.addEventListener("mouseleave", () => {
      dividerPanel.classList.add("hidden");
    });

    return { dividerTrigger, dividerPanel };
  };

  const { dividerTrigger, dividerPanel } = createDividerPanel();
  moreDropdown.appendChild(dividerTrigger);
  dividerTrigger.appendChild(dividerPanel);

  moreDiv.appendChild(moreDropdown);
  moreBtn.onclick = (e) => {
    toggleDropdown("dropdown-more", e);
  };
  row1.appendChild(moreDiv);

  toolbar.appendChild(row1);

  // 第二行：bold italic strike underline | 字号
  const row2 = document.createElement("div");
  row2.className = "ql-formats flex! items-center gap-3";

  const formatBtns = [
    { name: "bold", Icon: Bold, tooltip: t("bold") },
    { name: "italic", Icon: Italic, tooltip: t("italic") },
    { name: "strike", Icon: Strikethrough, tooltip: t("strike") },
    { name: "underline", Icon: Underline, tooltip: t("underline") },
  ];
  formatBtns.forEach(({ name, Icon, tooltip }) => {
    const button = document.createElement("button");
    button.className = `ql-${name}`;
    button.type = "button";
    button.innerHTML = renderIcon(Icon);
    button.onclick = () => {
      quill.format(name, !quill.getFormat()[name]);
    };
    row2.appendChild(createTooltipButton(button, tooltip));
  });

  // 分隔符
  const divider2 = document.createElement("span");
  divider2.className = "w-px h-4 bg-[#eceff4] mx-1";
  row2.appendChild(divider2);

  // 字号下拉
  const sizeDiv = document.createElement("div");
  sizeDiv.className = "relative inline-flex tooltip-wrapper";
  const sizeTrigger = document.createElement("button");
  sizeTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  sizeTrigger.type = "button";
  sizeTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(Type)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  sizeDiv.appendChild(sizeTrigger);
  const sizeTooltip = document.createElement("span");
  sizeTooltip.className = "tooltip";
  sizeTooltip.textContent = t("fontSize");
  sizeDiv.appendChild(sizeTooltip);

  const sizeMenu = document.createElement("div");
  sizeMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  sizeMenu.id = "dropdown-size";
  fontSizes.forEach(({ value, label }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.textContent = label;
    item.onclick = () => {
      quill.format("size", value);
      sizeMenu.classList.add("hidden");
    };
    sizeMenu.appendChild(item);
  });
  sizeDiv.appendChild(sizeMenu);
  sizeTrigger.onclick = (e) => {
    toggleDropdown("dropdown-size", e);
  };
  row2.appendChild(sizeDiv);

  toolbar.appendChild(row2);

  // 第三行：color bgcolor
  const row3 = document.createElement("div");
  row3.className = "ql-formats flex! items-center gap-3";

  const colorBtn = document.createElement("button");
  colorBtn.className = "ql-color";
  colorBtn.type = "button";
  colorBtn.innerHTML = renderIcon(Palette);
  colorBtn.onclick = (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById("dropdown-textColor");
    const isCurrentlyHidden = dropdown?.classList.contains("hidden");
    closeAllDropdowns();
    if (isCurrentlyHidden) {
      dropdown?.classList.remove("hidden");
    }
  };

  const bgColorBtn = document.createElement("button");
  bgColorBtn.className = "ql-background";
  bgColorBtn.type = "button";
  bgColorBtn.innerHTML = renderIcon(Highlighter);
  bgColorBtn.onclick = (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById("dropdown-bgColor");
    const isCurrentlyHidden = dropdown?.classList.contains("hidden");
    closeAllDropdowns();
    if (isCurrentlyHidden) {
      dropdown?.classList.remove("hidden");
    }
  };

  // 创建颜色下拉
  const colorDropdown = createColorDropdown(
    colorBtn,
    t("textColor"),
    "textColor",
    (color) => {
      quill.format("color", color);
    },
  );

  const bgColorDropdown = createColorDropdown(
    bgColorBtn,
    t("bgColor"),
    "bgColor",
    (color) => {
      quill.format("background", color);
    },
  );

  row3.appendChild(colorDropdown);
  row3.appendChild(bgColorDropdown);

  toolbar.appendChild(row3);

  // 第四行：align 下拉
  const row4 = document.createElement("div");
  row4.className = "ql-formats flex! items-center gap-3";

  const alignDiv = document.createElement("div");
  alignDiv.className = "relative inline-flex tooltip-wrapper";
  const alignTrigger = document.createElement("button");
  alignTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  alignTrigger.type = "button";
  alignTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(AlignLeft)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  alignDiv.appendChild(alignTrigger);
  const alignTooltip = document.createElement("span");
  alignTooltip.className = "tooltip";
  alignTooltip.textContent = t("align");
  alignDiv.appendChild(alignTooltip);

  const alignMenu = document.createElement("div");
  alignMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  alignMenu.id = "dropdown-align";
  const alignOptions = [
    { value: false, label: t("alignDefault"), Icon: AlignLeft },
    { value: "center", label: t("alignCenter"), Icon: AlignCenter },
    { value: "right", label: t("alignRight"), Icon: AlignRight },
  ];
  alignOptions.forEach(({ value, label, Icon }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.innerHTML = `${Icon ? renderIcon(Icon, "w-3.5 h-3.5") : ""}<span>${label}</span>`;
    item.onclick = () => {
      quill.format("align", value);
      alignMenu.classList.add("hidden");
    };
    alignMenu.appendChild(item);
  });
  alignDiv.appendChild(alignMenu);
  alignTrigger.onclick = (e) => {
    toggleDropdown("dropdown-align", e);
  };
  row4.appendChild(alignDiv);

  toolbar.appendChild(row4);

  // 第五行：list 下拉
  const row5 = document.createElement("div");
  row5.className = "ql-formats flex! items-center gap-3";

  const listOptions = [
    { value: "ordered", label: t("ordered"), Icon: ListOrdered },
    { value: "bullet", label: t("bullet"), Icon: List },
  ];

  const listDiv = document.createElement("div");
  listDiv.className = "relative inline-flex tooltip-wrapper";
  const listTrigger = document.createElement("button");
  listTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  listTrigger.type = "button";
  listTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(List)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  listDiv.appendChild(listTrigger);
  const listTooltip = document.createElement("span");
  listTooltip.className = "tooltip";
  listTooltip.textContent = t("list");
  listDiv.appendChild(listTooltip);

  const listMenu = document.createElement("div");
  listMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  listMenu.id = "dropdown-list";
  listOptions.forEach(({ value, label, Icon }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.innerHTML = `${Icon ? renderIcon(Icon, "w-4 h-4!") : ""}<span>${label}</span>`;
    item.onclick = () => {
      quill.format("list", quill.getFormat().list === value ? false : value);
      listMenu.classList.add("hidden");
    };
    listMenu.appendChild(item);
  });
  listDiv.appendChild(listMenu);
  listTrigger.onclick = (e) => {
    toggleDropdown("dropdown-list", e);
  };
  row5.appendChild(listDiv);

  toolbar.appendChild(row5);

  // 第六行：header 下拉
  const row6 = document.createElement("div");
  row6.className = "ql-formats flex! items-center gap-3";

  const headerDiv = document.createElement("div");
  headerDiv.className = "relative inline-flex tooltip-wrapper";
  const headerTrigger = document.createElement("button");
  headerTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  headerTrigger.type = "button";
  headerTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(icons.Heading1)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  headerDiv.appendChild(headerTrigger);
  const headerTooltip = document.createElement("span");
  headerTooltip.className = "tooltip";
  headerTooltip.textContent = t("header");
  headerDiv.appendChild(headerTooltip);

  const headerMenu = document.createElement("div");
  headerMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  headerMenu.id = "dropdown-header";
  const headerOptions = [
    { value: 1, label: "H1", Icon: Heading1 },
    { value: 2, label: "H2", Icon: Heading2 },
    { value: 3, label: "H3", Icon: Heading3 },
    { value: 4, label: "H4", Icon: Heading4 },
  ];
  headerOptions.forEach(({ value, label, Icon }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.innerHTML = `${Icon ? renderIcon(Icon, "w-3.5 h-3.5") : ""}<span>${label}</span>`;
    item.onclick = () => {
      quill.format("header", value);
      headerMenu.classList.add("hidden");
    };
    headerMenu.appendChild(item);
  });
  headerDiv.appendChild(headerMenu);
  headerTrigger.onclick = (e) => {
    toggleDropdown("dropdown-header", e);
  };
  row6.appendChild(headerDiv);

  toolbar.appendChild(row6);

  const editorContainer = container.querySelector(".editor-container");
  if (editorContainer) {
    container.insertBefore(toolbar, editorContainer);
  }
};
