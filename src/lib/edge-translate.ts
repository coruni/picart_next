/**
 * 自定义微软 Edge 翻译模块
 *
 * 不再依赖 translate.js 第三方库，直接调用微软 Edge 浏览器使用的免鉴权翻译接口：
 *   POST https://edge.microsoft.com/translate/translatetext?from={from}&to={to}&isEnterpriseClient=false
 *   body: ["文本1","文本2"]（裸字符串数组）   header: Content-Type: application/json
 *
 * 说明：旧的 edge.microsoft.com/translate/auth + api.cognitive.microsofttranslator.com 鉴权方案
 * 已被上游移除（auth 接口返回 404），当前接口无需鉴权即可直接使用。
 *
 * 本模块同时提供一个与旧 translate.js 调用方式兼容的 window.translate 对象，
 * 以便现有的 Provider / Hook / 组件代码无需大改即可切换到本地实现。
 */
"use client";

// ===================== 微软 Edge 翻译 API =====================

const EDGE_TRANSLATE_URL =
  "https://edge.microsoft.com/translate/translatetext";

/**
 * 项目使用的语种标识（旧 translate.js 的 language id）-> Edge BCP-47 代码
 */
const EDGE_LANGUAGE_CODES: Record<string, string> = {
  chinese_simplified: "zh-Hans",
  chinese_traditional: "zh-Hant",
  english: "en",
  japanese: "ja",
  korean: "ko",
  french: "fr",
  spanish: "es",
  german: "de",
  russian: "ru",
  italian: "it",
  portuguese: "pt",
};

/** 将一批文本翻译为指定语种，返回与入参一一对应的译文数组 */
async function translateWithEdge(
  texts: string[],
  fromEdge: string | null,
  toEdge: string,
): Promise<string[]> {
  if (texts.length === 0) return [];

  const query = new URLSearchParams({ to: toEdge, isEnterpriseClient: "false" });
  if (fromEdge) {
    query.set("from", fromEdge);
  }
  const url = `${EDGE_TRANSLATE_URL}?${query.toString()}`;

  // 按字符数分批请求，避免单次请求体过大
  const CHUNK_CHARS = 30000;
  const chunks: string[][] = [];
  let chunk: string[] = [];
  let size = 0;
  for (const text of texts) {
    chunk.push(text);
    size += text.length;
    if (size >= CHUNK_CHARS) {
      chunks.push(chunk);
      chunk = [];
      size = 0;
    }
  }
  if (chunk.length > 0) {
    chunks.push(chunk);
  }

  const results: string[] = [];
  for (const part of chunks) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 该接口请求体为裸字符串数组，旧版 [{Text:"..."}] 格式会被拒绝
      body: JSON.stringify(part),
      // 超时中止，避免请求挂起导致翻译队列（enqueueTranslate）永久卡死，
      // 否则后续“再次翻译”会一直无响应
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Edge translate failed: HTTP ${res.status}`);
    }
    const data: Array<{ translations: Array<{ text: string }> }> =
      await res.json();
    for (const item of data) {
      results.push(item.translations[0].text);
    }
  }
  return results;
}

// ===================== DOM 翻译引擎 =====================

let localLanguage = "chinese_simplified"; // 本地语种（旧 translate.js 的 language id）
let toLanguage = ""; // 当前要显示的目标语种
let translateDocuments: Element[] = []; // setDocuments 设置的翻译范围
const translatedNodes = new Set<Text>(); // 已翻译的文本节点（用于 reset 还原）
const originalTexts = new WeakMap<Text, string>(); // 文本节点的原文
const nodeDataMap = new Map<Text, unknown>(); // 与旧 translate.node.data 兼容，记录已翻译节点数

// 串行化翻译任务，避免并发翻译互相覆盖
let translateQueue: Promise<void> = Promise.resolve();
function enqueueTranslate(task: () => Promise<void>): void {
  translateQueue = translateQueue.then(task).catch((err) => {
    console.error("[edge-translate] Edge 翻译请求失败", err);
  });
}

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "PRE",
  "CODE",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "IFRAME",
  "VIDEO",
  "AUDIO",
]);

function isIgnoredElement(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  const className = typeof el.className === "string" ? el.className : "";
  const classes = className.split(/\s+/);
  // 跳过视频播放器 DOM（ArtPlayer 容器），避免翻译引擎修改播放器内部文本
  if (classes.includes("art-video-player")) return true;
  return classes.includes("ignore") || classes.includes("translateSelectLanguage");
}

/** 收集范围内可翻译的文本节点 */
function collectTextNodes(root: Node, out: Text[]): void {
  if (root.nodeType === Node.TEXT_NODE) {
    out.push(root as Text);
    return;
  }
  if (root.nodeType === Node.ELEMENT_NODE && isIgnoredElement(root as Element)) {
    return;
  }
  for (const child of Array.from(root.childNodes)) {
    collectTextNodes(child, out);
  }
}

/** 是否是需要翻译的文本：非空、包含字母类字符、长度在合理范围内 */
function isTranslatableText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.length > 5000) return false;
  return /[A-Za-z\u00C0-\u024F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/.test(
    trimmed,
  );
}

function hashCode(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36);
}

function cacheKeyOf(toEdge: string, text: string): string {
  return `et_${toEdge}_${hashCode(text)}`;
}

/** 将译文渲染到文本节点，保留原文本的前后空白 */
function applyTranslation(node: Text, translatedCore: string): void {
  const original = node.nodeValue ?? "";
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  const finalText = leading + translatedCore + trailing;
  if (finalText === original) return;
  if (!originalTexts.has(node)) {
    originalTexts.set(node, original);
  }
  node.nodeValue = finalText;
  translatedNodes.add(node);
  nodeDataMap.set(node, {});
}

/** 还原所有已翻译的文本节点 */
function reset(): void {
  for (const node of translatedNodes) {
    const original = originalTexts.get(node);
    if (original != null && node.nodeValue !== original) {
      node.nodeValue = original;
    }
  }
  translatedNodes.clear();
  nodeDataMap.clear();
}

/** 获取当前页面自动翻译的目标元素 */
function collectAutoDocuments(): Element[] {
  if (typeof document === "undefined") return [];
  return Array.from(
    document.querySelectorAll(
      "[data-auto-translate-content], [data-auto-translate-comment]",
    ),
  );
}

function setDocuments(docs: Element[] | NodeListOf<Element>): void {
  translateDocuments = Array.from(docs);
}

/**
 * 将指定元素（或 setDocuments 设置的范围）翻译为当前目标语种
 * 异步执行，翻译完成后通过 MutationObserver 反映到页面
 */
function execute(docs?: Element[] | NodeListOf<Element>): void {
  const target = toLanguage;
  if (!target) return;
  const toEdge = EDGE_LANGUAGE_CODES[target];
  if (!toEdge) return;
  // 注意：不能根据 localLanguage 与目标语种是否相同来短路。
  // localLanguage 被硬编码为页面本地语种（chinese_simplified），
  // 而评论/回复等 UGC 内容语言未知（可能是英文等），
  // 内容语言是否与目标语种匹配由上层（ContentAutoTranslateProvider /
  // useManualHtmlTranslate）通过语言检测判断，进入本函数的内容都需要翻译。

  const scope =
    docs && docs.length > 0
      ? Array.from(docs)
      : translateDocuments.length > 0
        ? translateDocuments
        : collectAutoDocuments();
  if (scope.length === 0) return;

  const nodes: Text[] = [];
  for (const el of scope) {
    collectTextNodes(el, nodes);
  }

  // 收集需要翻译的文本（按去重后的原文分组），并优先应用缓存命中项
  const pending = new Map<string, Text[]>();
  const cached: Array<[Text, string]> = [];
  for (const node of nodes) {
    if (translatedNodes.has(node)) continue;
    const original = node.nodeValue ?? "";
    if (!isTranslatableText(original)) continue;
    const trimmed = original.trim();
    const cacheKey = cacheKeyOf(toEdge, trimmed);
    const hit = storage.get(cacheKey);
    if (typeof hit === "string" && hit.length > 0) {
      cached.push([node, hit]);
    } else {
      const list = pending.get(trimmed);
      if (list) {
        list.push(node);
      } else {
        pending.set(trimmed, [node]);
      }
    }
  }
  for (const [node, result] of cached) {
    applyTranslation(node, result);
  }
  if (pending.size === 0) return;

  const texts = Array.from(pending.keys());
  enqueueTranslate(async () => {
    // 不传 from：微软接口会自动检测每条文本的源语言。
    // 评论等 UGC 内容语言未知，若硬传 localLanguage（chinese_simplified）
    // 会导致 from===to（如中文用户看英文评论时 to=zh-Hans），接口直接返回原文不翻译。
    const results = await translateWithEdge(texts, null, toEdge);
    for (let i = 0; i < texts.length; i++) {
      const translated = results[i] ?? "";
      const list = pending.get(texts[i]) ?? [];
      for (const node of list) {
        applyTranslation(node, translated);
      }
      if (translated.length > 0) {
        storage.set(cacheKeyOf(toEdge, texts[i]), translated);
      }
    }
  });
}

/** 切换目标语种：记录语种 -> 还原原文 -> 重新翻译当前范围 */
function changeLanguage(language: string): void {
  if (!language) return;
  toLanguage = language;
  storage.set("to", language);
  reset();
  execute();
}

// ===================== 对外兼容层（window.translate） =====================

const language = {
  setLocal(lang: string): void {
    if (lang) {
      localLanguage = lang;
    }
  },
  getLocal(): string {
    return localLanguage;
  },
  getCurrent(): string {
    return toLanguage && toLanguage !== localLanguage
      ? toLanguage
      : localLanguage;
  },
  translateLocal: true, // 兼容旧调用：始终翻译内容
};

const service = {
  use(): void {
    // 本实现始终直接使用微软 Edge 翻译 API，无需切换服务通道
  },
};

const selectLanguageTag = { show: false }; // 本实现不生成语言选择下拉框

const storage = {
  set(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sessionStorage 不可用（如隐私模式）时静默忽略
    }
  },
  get(key: string): unknown {
    try {
      const item = sessionStorage.getItem(key);
      if (item == null) return undefined;
      return JSON.parse(item);
    } catch {
      return undefined;
    }
  },
};

const listener = {
  start(): void {
    // 动态新增内容的翻译由调用方（ContentAutoTranslateProvider 等）自行监听处理
  },
};

export const edgeTranslate = {
  get to(): string {
    return toLanguage;
  },
  set to(value: string) {
    toLanguage = value || "";
  },
  language,
  service,
  selectLanguageTag,
  storage,
  node: { data: nodeDataMap },
  setDocuments,
  execute,
  changeLanguage,
  reset,
  listener,
};

// 安装到 window.translate，兼容现有调用方（仅在浏览器环境）
if (typeof window !== "undefined") {
  (window as unknown as { translate: unknown }).translate = edgeTranslate;
}

export { translateWithEdge, EDGE_LANGUAGE_CODES };
